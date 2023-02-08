import { HttpApi } from '@aws-cdk/aws-apigatewayv2-alpha'
import { CfnOutput, Duration, Stack } from 'aws-cdk-lib'
import { ICertificate } from 'aws-cdk-lib/aws-certificatemanager'
import {
	AllowedMethods,
	CacheCookieBehavior,
	CacheHeaderBehavior,
	CachePolicy,
	CacheQueryStringBehavior,
	Distribution,
	IOrigin,
	PriceClass,
	ViewerProtocolPolicy,
} from 'aws-cdk-lib/aws-cloudfront'
import { HttpOrigin, S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins'
import { Bucket } from 'aws-cdk-lib/aws-s3'
import { ImageSettings } from '../types'

export interface SetupCfnDistroProps {
	domainName?: string
	certificate?: ICertificate
	apiGateway: HttpApi
	imageBasePath: string
	serverBasePath: string
	assetsBucket: Bucket
	customApiOrigin?: IOrigin
	imageSettings?: ImageSettings
}

export const setupCfnDistro = (
	scope: Stack,
	{ apiGateway, imageBasePath, serverBasePath, assetsBucket, domainName, imageSettings, certificate, customApiOrigin }: SetupCfnDistroProps,
) => {
	const apiGwDomainName = `${apiGateway.apiId}.execute-api.${scope.region}.amazonaws.com`

	const serverOrigin = new HttpOrigin(apiGwDomainName, { originPath: serverBasePath })
	const imageOrigin = new HttpOrigin(apiGwDomainName, { originPath: imageBasePath })
	const assetsOrigin = new S3Origin(assetsBucket)

	const defaultOptions = {
		viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
		allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
	}

	// const defaultCacheOptions = {
	// 	headerBehavior: CacheHeaderBehavior.allowList('accept', 'accept-language', 'content-language', 'content-type', 'user-agent', 'authorization'),
	// 	queryStringBehavior: CacheQueryStringBehavior.all(),
	// 	cookieBehavior: CacheCookieBehavior.all(),
	// }

	const imagesCachePolicy = CachePolicy.fromCachePolicyId(scope, 'NextImageCachePolicy', 'b0b8475c-e5ad-48ec-a9aa-ab4edce43324')
	// const imagesCachePolicy = new CachePolicy(scope, 'NextImageCachePolicy', {
	// 	queryStringBehavior: CacheQueryStringBehavior.all(),
	// 	enableAcceptEncodingGzip: true,
	// 	defaultTtl: Duration.days(30),
	// })

	const serverCachePolicy = CachePolicy.fromCachePolicyId(scope, 'NextServerCachePolicy', 'dde765f7-44f6-4582-a848-865995f4d089')
	// const serverCachePolicy = new CachePolicy(scope, 'NextServerCachePolicy', {
	// 	...defaultCacheOptions,
	// })

	const apiCachePolicy = CachePolicy.fromCachePolicyId(scope, 'NextApiCachePolicy', '9aec2d57-3eb2-4ee6-8368-140faf94e0ba')
	// const apiCachePolicy = new CachePolicy(scope, 'NextApiCachePolicy', {
	// 	...defaultCacheOptions,
	// 	maxTtl: Duration.seconds(0),
	// })

	// Public folder persists names so we are making default TTL lower for cases when invalidation does not happen.
	const assetsCachePolicy = CachePolicy.fromCachePolicyId(scope, 'NextPublicCachePolicy', 'f5792294-8244-4334-bb16-a9d8a4b26ed3')
	// const assetsCachePolicy = new CachePolicy(scope, 'NextPublicCachePolicy', {
	// 	queryStringBehavior: CacheQueryStringBehavior.all(),
	// 	enableAcceptEncodingGzip: true,
	// 	defaultTtl: Duration.hours(12),
	// })

	// We don't use LambdaFunctionAssociation as that's meant only for Lambda@Edge.
	// Caching is optinionated to work out-of-the-box, for granular access and customization, create your own cache policies.
	const cfnDistro = new Distribution(scope, 'CfnDistro', {
		defaultRootObject: '',
		comment: `CloudFront distribution for ${scope.stackName}`,
		enableIpv6: true,
		priceClass: PriceClass.PRICE_CLASS_100,
		domainNames: domainName ? [domainName] : undefined,
		certificate,
		defaultBehavior: {
			origin: serverOrigin,
			allowedMethods: AllowedMethods.ALLOW_ALL,
			cachePolicy: serverCachePolicy,
			viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
		},
		additionalBehaviors: {
			'/api*': {
				...defaultOptions,
				origin: customApiOrigin ?? serverOrigin,
				allowedMethods: AllowedMethods.ALLOW_ALL,
				cachePolicy: apiCachePolicy,
			},
			'_next/data/*': {
				...defaultOptions,
				origin: serverOrigin,
			},
			'_next/image*': {
				...defaultOptions,
				origin: imageOrigin,
				cachePolicy: imagesCachePolicy,
				compress: true,
			},
			'_next/*': {
				...defaultOptions,
				origin: assetsOrigin,
			},
			'assets/*': {
				...defaultOptions,
				origin: assetsOrigin,
				cachePolicy: assetsCachePolicy,
			},
			...imageSettings?.publicFilePaths?.reduce((acc, pathPattern: string) => {
				if (['assets/*', '_next/*'].includes(pathPattern)) {
					return acc
				}

				return {
					...acc,
					[pathPattern]: {
						...defaultOptions,
						origin: assetsOrigin,
						cachePolicy: assetsCachePolicy,
					},
				}
			}, {}),
		},
	})

	new CfnOutput(scope, 'cfnDistroUrl', { value: cfnDistro.distributionDomainName })
	new CfnOutput(scope, 'cfnDistroId', { value: cfnDistro.distributionId })
	new CfnOutput(scope, 'domainName', { value: domainName || '<empty>' })

	return cfnDistro
}
