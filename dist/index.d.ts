import * as aws_cdk_lib_aws_lambda from 'aws-cdk-lib/aws-lambda';
import { Function } from 'aws-cdk-lib/aws-lambda';
import * as aws_cdk_lib_aws_cloudfront from 'aws-cdk-lib/aws-cloudfront';
import { IOrigin, IDistribution } from 'aws-cdk-lib/aws-cloudfront';
import * as aws_cdk_lib_aws_s3 from 'aws-cdk-lib/aws-s3';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import * as aws_cdk_lib_aws_certificatemanager from 'aws-cdk-lib/aws-certificatemanager';
import { ICertificate } from 'aws-cdk-lib/aws-certificatemanager';
import * as _aws_cdk_aws_apigatewayv2_alpha from '@aws-cdk/aws-apigatewayv2-alpha';
import { HttpApi } from '@aws-cdk/aws-apigatewayv2-alpha';
import * as aws_cdk_lib from 'aws-cdk-lib';
import { StackProps, Stack, App } from 'aws-cdk-lib';
import { IHostedZone } from 'aws-cdk-lib/aws-route53';

declare type Handler = (event: Object, context: Object) => Promise<Object>;
declare const handler: Handler;

interface ImageSettings {
    publicFilePaths: string[];
}
interface CustomStackProps extends StackProps {
    apigwServerPath: string;
    apigwImagePath: string;
    assetsZipPath: string;
    codeZipPath: string;
    dependenciesZipPath: string;
    imageHandlerZipPath: string;
    imageLayerZipPath: string;
    imageLambdaHash: string;
    customServerHandler: string;
    customImageHandler: string;
    lambdaTimeout: number;
    lambdaMemory: number;
    imageLambdaTimeout?: number;
    imageLambdaMemory?: number;
    hostedZone?: string;
    dnsPrefix?: string;
    customApiDomain?: string;
    redirectFromApex?: boolean;
    imageSettings: ImageSettings;
    certificateArn?: string;
}

interface SetupApiGwProps {
    imageLambda: Function;
    serverLambda: Function;
    imageBasePath: string;
    serverBasePath: string;
}

interface SetupCfnCertificateProps {
    hostedZone: IHostedZone;
    domainName: string;
}

interface SetupCfnDistroProps {
    domainName?: string;
    certificate?: ICertificate;
    apiGateway: HttpApi;
    imageBasePath: string;
    serverBasePath: string;
    assetsBucket: Bucket;
    customApiOrigin?: IOrigin;
    imageSettings?: ImageSettings;
}

interface SetupDnsRecordsProps {
    dnsPrefix?: string;
    hostedZone: IHostedZone;
    cfnDistro: IDistribution;
}

interface SetupImageLambdaProps {
    codePath: string;
    handler: string;
    assetsBucket: Bucket;
    layerPath: string;
    lambdaHash: string;
    memory?: number;
    timeout?: number;
}

interface SetupApexRedirectProps {
    sourceHostedZone: IHostedZone;
    targetDomain: string;
}

interface UploadAssetsProps {
    assetsBucket: Bucket;
    assetsPath: string;
    cfnDistribution: IDistribution;
}

interface SetupServerLambdaProps {
    codePath: string;
    dependenciesPath: string;
    handler: string;
    basePath: string;
    memory: number;
    timeout: number;
}

declare class NextStandaloneStack extends Stack {
    imageLambda?: Function;
    serverLambda?: Function;
    apiGateway?: HttpApi;
    assetsBucket?: Bucket;
    cfnDistro?: IDistribution;
    cfnCertificate?: ICertificate;
    hostedZone?: IHostedZone;
    domainName?: string;
    imageSettings?: ImageSettings;
    constructor(scope: App, id: string, config: CustomStackProps);
    setupAssetsBucket(): Bucket;
    setupApiGateway(props: SetupApiGwProps): HttpApi;
    setupServerLambda(props: SetupServerLambdaProps): Function;
    setupImageLambda(props: SetupImageLambdaProps): Function;
    setupCfnDistro(props: SetupCfnDistroProps): aws_cdk_lib_aws_cloudfront.Distribution;
    setupCfnCertificate(props: SetupCfnCertificateProps): aws_cdk_lib_aws_certificatemanager.DnsValidatedCertificate;
    setupDnsRecords(props: SetupDnsRecordsProps): void;
    setupApexRedirect(props: SetupApexRedirectProps): void;
    uploadStaticAssets(props: UploadAssetsProps): void;
}

declare const CdkUtils: {
    setupApiGateway: (scope: aws_cdk_lib.Stack, { imageLambda, imageBasePath, serverLambda, serverBasePath }: SetupApiGwProps) => _aws_cdk_aws_apigatewayv2_alpha.HttpApi;
    setupCfnCertificate: (scope: aws_cdk_lib.Stack, { hostedZone, domainName }: SetupCfnCertificateProps) => aws_cdk_lib_aws_certificatemanager.DnsValidatedCertificate;
    setupAssetsBucket: (scope: aws_cdk_lib.Stack) => aws_cdk_lib_aws_s3.Bucket;
    setupCfnDistro: (scope: aws_cdk_lib.Stack, { apiGateway, imageBasePath, serverBasePath, assetsBucket, domainName, imageSettings, certificate, customApiOrigin }: SetupCfnDistroProps) => aws_cdk_lib_aws_cloudfront.Distribution;
    setupDnsRecords: (scope: aws_cdk_lib.Stack, { dnsPrefix, hostedZone, cfnDistro }: SetupDnsRecordsProps) => void;
    setupImageLambda: (scope: aws_cdk_lib.Stack, { assetsBucket, codePath, handler, layerPath, lambdaHash, memory, timeout }: SetupImageLambdaProps) => aws_cdk_lib_aws_lambda.Function;
    setupServerLambda: (scope: aws_cdk_lib.Stack, { basePath, codePath, dependenciesPath, handler, memory, timeout }: SetupServerLambdaProps) => aws_cdk_lib_aws_lambda.Function;
    uploadStaticAssets: (scope: aws_cdk_lib.Stack, { assetsBucket, assetsPath, cfnDistribution }: UploadAssetsProps) => void;
};

export { CdkUtils, CustomStackProps, NextStandaloneStack, SetupApiGwProps, SetupCfnCertificateProps, SetupCfnDistroProps, SetupDnsRecordsProps, SetupImageLambdaProps, SetupServerLambdaProps, UploadAssetsProps, handler as serverHandler };
