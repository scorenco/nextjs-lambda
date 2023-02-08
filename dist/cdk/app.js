"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// lib/cdk/app.ts
var import_imaginex_lambda = require("@sladg/imaginex-lambda");
var import_aws_cdk_lib10 = require("aws-cdk-lib");
var import_path = __toESM(require("path"));

// lib/cdk/config.ts
var import_envalid = require("envalid");

// lib/cdk/utils/imageLambda.ts
var import_aws_cdk_lib = require("aws-cdk-lib");
var import_aws_lambda = require("aws-cdk-lib/aws-lambda");
var DEFAULT_MEMORY = 512;
var DEFAULT_TIMEOUT = 10;
var setupImageLambda = (scope, { assetsBucket, codePath, handler: handler2, layerPath, lambdaHash, memory = DEFAULT_MEMORY, timeout = DEFAULT_TIMEOUT }) => {
  const depsLayer = new import_aws_lambda.LayerVersion(scope, "ImageOptimizationLayer", {
    code: import_aws_lambda.Code.fromAsset(layerPath, {
      assetHash: lambdaHash + "_layer",
      assetHashType: import_aws_cdk_lib.AssetHashType.CUSTOM
    })
  });
  const imageLambda = new import_aws_lambda.Function(scope, "ImageOptimizationNextJs", {
    code: import_aws_lambda.Code.fromAsset(codePath, {
      assetHash: lambdaHash + "_code",
      assetHashType: import_aws_cdk_lib.AssetHashType.CUSTOM
    }),
    runtime: import_aws_lambda.Runtime.PYTHON_3_8,
    handler: handler2,
    memorySize: memory,
    timeout: import_aws_cdk_lib.Duration.seconds(timeout),
    layers: [depsLayer],
    environment: {
      S3_BUCKET_NAME: assetsBucket.bucketName
    }
  });
  assetsBucket.grantRead(imageLambda);
  new import_aws_cdk_lib.CfnOutput(scope, "imageLambdaArn", { value: imageLambda.functionArn });
  return imageLambda;
};

// lib/cdk/utils/serverLambda.ts
var import_aws_cdk_lib2 = require("aws-cdk-lib");
var import_aws_lambda2 = require("aws-cdk-lib/aws-lambda");
var DEFAULT_MEMORY2 = 1024;
var DEFAULT_TIMEOUT2 = 20;
var setupServerLambda = (scope, { basePath, codePath, dependenciesPath, handler: handler2, memory = DEFAULT_MEMORY2, timeout = DEFAULT_TIMEOUT2 }) => {
  const depsLayer = new import_aws_lambda2.LayerVersion(scope, "DepsLayer", {
    code: import_aws_lambda2.Code.fromAsset(dependenciesPath)
  });
  const serverLambda = new import_aws_lambda2.Function(scope, "DefaultNextJs", {
    code: import_aws_lambda2.Code.fromAsset(codePath),
    runtime: import_aws_lambda2.Runtime.NODEJS_16_X,
    handler: handler2,
    layers: [depsLayer],
    memorySize: memory,
    timeout: import_aws_cdk_lib2.Duration.seconds(timeout),
    environment: {
      ...Object.entries(process.env).filter(([key]) => key.startsWith("NEXT_")).reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {}),
      NEXTJS_LAMBDA_BASE_PATH: basePath
    }
  });
  new import_aws_cdk_lib2.CfnOutput(scope, "serverLambdaArn", { value: serverLambda.functionArn });
  return serverLambda;
};

// lib/cdk/config.ts
var RawEnvConfig = (0, import_envalid.cleanEnv)(process.env, {
  STACK_NAME: (0, import_envalid.str)(),
  LAMBDA_TIMEOUT: (0, import_envalid.num)({ default: DEFAULT_TIMEOUT2 }),
  LAMBDA_MEMORY: (0, import_envalid.num)({ default: DEFAULT_MEMORY2 }),
  IMAGE_LAMBDA_TIMEOUT: (0, import_envalid.num)({ default: DEFAULT_TIMEOUT }),
  IMAGE_LAMBDA_MEMORY: (0, import_envalid.num)({ default: DEFAULT_MEMORY }),
  HOSTED_ZONE: (0, import_envalid.str)({ default: void 0 }),
  DNS_PREFIX: (0, import_envalid.str)({ default: void 0 }),
  CUSTOM_API_DOMAIN: (0, import_envalid.str)({ default: void 0 }),
  CERTIFICATE_ARN: (0, import_envalid.str)({ default: void 0 }),
  REDIRECT_FROM_APEX: (0, import_envalid.bool)({ default: false })
});
var envConfig = {
  stackName: RawEnvConfig.STACK_NAME,
  lambdaMemory: RawEnvConfig.LAMBDA_MEMORY,
  lambdaTimeout: RawEnvConfig.LAMBDA_TIMEOUT,
  imageLambdaMemory: RawEnvConfig.IMAGE_LAMBDA_MEMORY,
  imageLambdaTimeout: RawEnvConfig.IMAGE_LAMBDA_TIMEOUT,
  hostedZone: RawEnvConfig.HOSTED_ZONE,
  dnsPrefix: RawEnvConfig.DNS_PREFIX,
  certificateArn: RawEnvConfig.CERTIFICATE_ARN,
  customApiDomain: RawEnvConfig.CUSTOM_API_DOMAIN,
  redirectFromApex: RawEnvConfig.REDIRECT_FROM_APEX
};

// lib/cdk/stack.ts
var import_aws_cdk_lib9 = require("aws-cdk-lib");
var import_aws_certificatemanager2 = require("aws-cdk-lib/aws-certificatemanager");
var import_aws_cloudfront_origins2 = require("aws-cdk-lib/aws-cloudfront-origins");
var import_aws_route532 = require("aws-cdk-lib/aws-route53");

// lib/cdk/utils/apiGw.ts
var import_aws_apigatewayv2_alpha = require("@aws-cdk/aws-apigatewayv2-alpha");
var import_aws_apigatewayv2_integrations_alpha = require("@aws-cdk/aws-apigatewayv2-integrations-alpha");
var import_aws_cdk_lib3 = require("aws-cdk-lib");
var setupApiGateway = (scope, { imageLambda, imageBasePath, serverLambda, serverBasePath }) => {
  const apiGateway = new import_aws_apigatewayv2_alpha.HttpApi(scope, "ServerProxy");
  apiGateway.addRoutes({ path: `${serverBasePath}/{proxy+}`, integration: new import_aws_apigatewayv2_integrations_alpha.HttpLambdaIntegration("LambdaApigwIntegration", serverLambda) });
  apiGateway.addRoutes({ path: `${imageBasePath}/{proxy+}`, integration: new import_aws_apigatewayv2_integrations_alpha.HttpLambdaIntegration("ImagesApigwIntegration", imageLambda) });
  new import_aws_cdk_lib3.CfnOutput(scope, "apiGwUrlServerUrl", { value: `${apiGateway.apiEndpoint}${serverBasePath}` });
  new import_aws_cdk_lib3.CfnOutput(scope, "apiGwUrlImageUrl", { value: `${apiGateway.apiEndpoint}${imageBasePath}` });
  return apiGateway;
};

// lib/cdk/utils/cfnCertificate.ts
var import_aws_cdk_lib4 = require("aws-cdk-lib");
var import_aws_certificatemanager = require("aws-cdk-lib/aws-certificatemanager");
var setupCfnCertificate = (scope, { hostedZone, domainName }) => {
  const certificate = new import_aws_certificatemanager.DnsValidatedCertificate(scope, "Certificate", { domainName, hostedZone, region: "us-east-1" });
  new import_aws_cdk_lib4.CfnOutput(scope, "certificateArn", { value: certificate.certificateArn });
  return certificate;
};

// lib/cdk/utils/cfnDistro.ts
var import_aws_cdk_lib5 = require("aws-cdk-lib");
var import_aws_cloudfront = require("aws-cdk-lib/aws-cloudfront");
var import_aws_cloudfront_origins = require("aws-cdk-lib/aws-cloudfront-origins");
var setupCfnDistro = (scope, { apiGateway, imageBasePath, serverBasePath, assetsBucket, domainName, imageSettings, certificate, customApiOrigin }) => {
  var _a2;
  const apiGwDomainName = `${apiGateway.apiId}.execute-api.${scope.region}.amazonaws.com`;
  const serverOrigin = new import_aws_cloudfront_origins.HttpOrigin(apiGwDomainName, { originPath: serverBasePath });
  const imageOrigin = new import_aws_cloudfront_origins.HttpOrigin(apiGwDomainName, { originPath: imageBasePath });
  const assetsOrigin = new import_aws_cloudfront_origins.S3Origin(assetsBucket);
  const defaultOptions = {
    viewerProtocolPolicy: import_aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    allowedMethods: import_aws_cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS
  };
  const imagesCachePolicy = import_aws_cloudfront.CachePolicy.fromCachePolicyId(scope, "NextImageCachePolicy", "b0b8475c-e5ad-48ec-a9aa-ab4edce43324");
  const serverCachePolicy = import_aws_cloudfront.CachePolicy.fromCachePolicyId(scope, "NextServerCachePolicy", "dde765f7-44f6-4582-a848-865995f4d089");
  const apiCachePolicy = import_aws_cloudfront.CachePolicy.fromCachePolicyId(scope, "NextApiCachePolicy", "9aec2d57-3eb2-4ee6-8368-140faf94e0ba");
  const assetsCachePolicy = import_aws_cloudfront.CachePolicy.fromCachePolicyId(scope, "NextPublicCachePolicy", "f5792294-8244-4334-bb16-a9d8a4b26ed3");
  const cfnDistro = new import_aws_cloudfront.Distribution(scope, "CfnDistro", {
    defaultRootObject: "",
    comment: `CloudFront distribution for ${scope.stackName}`,
    enableIpv6: true,
    priceClass: import_aws_cloudfront.PriceClass.PRICE_CLASS_100,
    domainNames: domainName ? [domainName] : void 0,
    certificate,
    defaultBehavior: {
      origin: serverOrigin,
      allowedMethods: import_aws_cloudfront.AllowedMethods.ALLOW_ALL,
      cachePolicy: serverCachePolicy,
      viewerProtocolPolicy: import_aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS
    },
    additionalBehaviors: {
      "/api*": {
        ...defaultOptions,
        origin: customApiOrigin != null ? customApiOrigin : serverOrigin,
        allowedMethods: import_aws_cloudfront.AllowedMethods.ALLOW_ALL,
        cachePolicy: apiCachePolicy
      },
      "_next/data/*": {
        ...defaultOptions,
        origin: serverOrigin
      },
      "_next/image*": {
        ...defaultOptions,
        origin: imageOrigin,
        cachePolicy: imagesCachePolicy,
        compress: true
      },
      "_next/*": {
        ...defaultOptions,
        origin: assetsOrigin
      },
      "assets/*": {
        ...defaultOptions,
        origin: assetsOrigin,
        cachePolicy: assetsCachePolicy
      },
      ...(_a2 = imageSettings == null ? void 0 : imageSettings.publicFilePaths) == null ? void 0 : _a2.reduce((acc, pathPattern) => {
        if (["assets/*", "_next/*"].includes(pathPattern)) {
          return acc;
        }
        return {
          ...acc,
          [pathPattern]: {
            ...defaultOptions,
            origin: assetsOrigin,
            cachePolicy: assetsCachePolicy
          }
        };
      }, {})
    }
  });
  new import_aws_cdk_lib5.CfnOutput(scope, "cfnDistroUrl", { value: cfnDistro.distributionDomainName });
  new import_aws_cdk_lib5.CfnOutput(scope, "cfnDistroId", { value: cfnDistro.distributionId });
  new import_aws_cdk_lib5.CfnOutput(scope, "domainName", { value: domainName || "<empty>" });
  return cfnDistro;
};

// lib/cdk/utils/dnsRecords.ts
var import_aws_cdk_lib6 = require("aws-cdk-lib");
var import_aws_route53 = require("aws-cdk-lib/aws-route53");
var import_aws_route53_targets = require("aws-cdk-lib/aws-route53-targets");
var setupDnsRecords = (scope, { dnsPrefix: recordName, hostedZone: zone, cfnDistro }) => {
  const target = import_aws_route53.RecordTarget.fromAlias(new import_aws_route53_targets.CloudFrontTarget(cfnDistro));
  const dnsARecord = new import_aws_route53.ARecord(scope, "AAliasRecord", { recordName, target, zone });
  const dnsAaaaRecord = new import_aws_route53.AaaaRecord(scope, "AaaaAliasRecord", { recordName, target, zone });
  new import_aws_cdk_lib6.CfnOutput(scope, "dns_A_Record", { value: dnsARecord.domainName });
  new import_aws_cdk_lib6.CfnOutput(scope, "dns_AAAA_Record", { value: dnsAaaaRecord.domainName });
};

// lib/cdk/utils/redirect.ts
var import_aws_cdk_lib7 = require("aws-cdk-lib");
var import_aws_route53_patterns = require("aws-cdk-lib/aws-route53-patterns");
var setupApexRedirect = (scope, { sourceHostedZone, targetDomain }) => {
  new import_aws_route53_patterns.HttpsRedirect(scope, `ApexRedirect`, {
    zone: sourceHostedZone,
    targetDomain
  });
  new import_aws_cdk_lib7.CfnOutput(scope, "RedirectFrom", { value: sourceHostedZone.zoneName });
};

// lib/cdk/utils/s3.ts
var import_aws_cdk_lib8 = require("aws-cdk-lib");
var import_aws_s3 = require("aws-cdk-lib/aws-s3");
var import_aws_s3_deployment = require("aws-cdk-lib/aws-s3-deployment");
var setupAssetsBucket = (scope) => {
  const assetsBucket = new import_aws_s3.Bucket(scope, "NextAssetsBucket", {
    removalPolicy: import_aws_cdk_lib8.RemovalPolicy.DESTROY,
    autoDeleteObjects: true,
    publicReadAccess: false
  });
  new import_aws_cdk_lib8.CfnOutput(scope, "assetsBucketUrl", { value: assetsBucket.bucketDomainName });
  new import_aws_cdk_lib8.CfnOutput(scope, "assetsBucketName", { value: assetsBucket.bucketName });
  return assetsBucket;
};
var uploadStaticAssets = (scope, { assetsBucket, assetsPath, cfnDistribution }) => {
  new import_aws_s3_deployment.BucketDeployment(scope, "PublicFilesDeployment", {
    destinationBucket: assetsBucket,
    sources: [import_aws_s3_deployment.Source.asset(assetsPath)],
    distribution: cfnDistribution,
    distributionPaths: ["/*"]
  });
};

// lib/cdk/stack.ts
var NextStandaloneStack = class extends import_aws_cdk_lib9.Stack {
  constructor(scope, id, config) {
    var _a2, _b;
    super(scope, id, config);
    console.log("CDK's config:", config);
    const enabledRoute53 = (_a2 = config.hostedZone) == null ? void 0 : _a2.endsWith(".ch");
    if (config.hostedZone) {
      this.hostedZone = import_aws_route532.HostedZone.fromLookup(this, "HostedZone_certificate", { domainName: config.hostedZone });
      this.domainName = config.dnsPrefix ? `${config.dnsPrefix}.${config.hostedZone}` : config.hostedZone;
    }
    console.log("Hosted zone:", this.hostedZone);
    console.log("Normalized domain name:", this.domainName);
    this.assetsBucket = this.setupAssetsBucket();
    this.imageSettings = config.imageSettings;
    this.imageLambda = this.setupImageLambda({
      codePath: config.imageHandlerZipPath,
      handler: config.customImageHandler,
      assetsBucket: this.assetsBucket,
      lambdaHash: config.imageLambdaHash,
      layerPath: config.imageLayerZipPath,
      timeout: config.imageLambdaTimeout,
      memory: config.imageLambdaMemory
    });
    this.serverLambda = this.setupServerLambda({
      basePath: config.apigwServerPath,
      codePath: config.codeZipPath,
      handler: config.customServerHandler,
      dependenciesPath: config.dependenciesZipPath,
      timeout: config.lambdaTimeout,
      memory: config.lambdaMemory
    });
    this.apiGateway = this.setupApiGateway({
      imageLambda: this.imageLambda,
      serverLambda: this.serverLambda,
      imageBasePath: config.apigwImagePath,
      serverBasePath: config.apigwServerPath
    });
    if (!!config.certificateArn) {
      this.cfnCertificate = import_aws_certificatemanager2.Certificate.fromCertificateArn(this, (_b = config.certificateArn.split("/")) == null ? void 0 : _b[1], config.certificateArn);
    } else if (!!this.hostedZone && !!this.domainName) {
      this.cfnCertificate = this.setupCfnCertificate({
        hostedZone: this.hostedZone,
        domainName: this.domainName
      });
    }
    this.cfnDistro = this.setupCfnDistro({
      assetsBucket: this.assetsBucket,
      apiGateway: this.apiGateway,
      imageBasePath: config.apigwImagePath,
      serverBasePath: config.apigwServerPath,
      domainName: this.domainName,
      certificate: this.cfnCertificate,
      customApiOrigin: config.customApiDomain ? new import_aws_cloudfront_origins2.HttpOrigin(config.customApiDomain) : void 0,
      imageSettings: this.imageSettings
    });
    this.uploadStaticAssets({
      assetsBucket: this.assetsBucket,
      assetsPath: config.assetsZipPath,
      cfnDistribution: this.cfnDistro
    });
    if (enabledRoute53 && !!this.hostedZone && !!this.domainName) {
      this.setupDnsRecords({
        cfnDistro: this.cfnDistro,
        hostedZone: this.hostedZone,
        dnsPrefix: config.dnsPrefix
      });
      if (!!config.redirectFromApex) {
        this.setupApexRedirect({
          sourceHostedZone: this.hostedZone,
          targetDomain: this.domainName
        });
      }
    }
  }
  setupAssetsBucket() {
    return setupAssetsBucket(this);
  }
  setupApiGateway(props) {
    return setupApiGateway(this, props);
  }
  setupServerLambda(props) {
    return setupServerLambda(this, props);
  }
  setupImageLambda(props) {
    return setupImageLambda(this, props);
  }
  setupCfnDistro(props) {
    return setupCfnDistro(this, props);
  }
  setupCfnCertificate(props) {
    return setupCfnCertificate(this, props);
  }
  setupDnsRecords(props) {
    return setupDnsRecords(this, props);
  }
  setupApexRedirect(props) {
    return setupApexRedirect(this, props);
  }
  uploadStaticAssets(props) {
    return uploadStaticAssets(this, props);
  }
};

// lib/cdk/app.ts
var app = new import_aws_cdk_lib10.App();
var commandCwd = process.cwd();
var _a;
new NextStandaloneStack(app, envConfig.stackName, {
  assetsZipPath: import_path.default.resolve(commandCwd, "./next.out/assetsLayer.zip"),
  codeZipPath: import_path.default.resolve(commandCwd, "./next.out/code.zip"),
  dependenciesZipPath: import_path.default.resolve(commandCwd, "./next.out/dependenciesLayer.zip"),
  customServerHandler: "index.handler",
  imageHandlerZipPath: import_imaginex_lambda.optimizerCodePath,
  imageLayerZipPath: import_imaginex_lambda.optimizerLayerPath,
  imageLambdaHash: `${import_imaginex_lambda.name}_${import_imaginex_lambda.version}`,
  customImageHandler: import_imaginex_lambda.handler,
  imageSettings: require(import_path.default.resolve(commandCwd, "./next.out/image-settings.json")),
  apigwServerPath: "/_server",
  apigwImagePath: "/_image",
  ...envConfig,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: (_a = process.env.AWS_REGION) != null ? _a : process.env.CDK_DEFAULT_REGION
  }
});
app.synth();
