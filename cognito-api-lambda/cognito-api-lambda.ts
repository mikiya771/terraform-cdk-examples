import { Construct } from 'constructs';
import {ApiGatewayAuthorizer, ApiGatewayAuthorizerConfig, ApiGatewayIntegration, ApiGatewayIntegrationConfig, ApiGatewayMethod, ApiGatewayMethodConfig, ApiGatewayResource, ApiGatewayResourceConfig, ApiGatewayRestApi, ApiGatewayRestApiConfig, CognitoUserPool, CognitoUserPoolConfig, LambdaFunction, LambdaFunctionConfig} from './.gen/providers/aws';

export interface CognitoAPILambdaProps {
    lambdaFunctionProps: LambdaFunctionConfig;
    apiGatewayRestApiProps: Omit<ApiGatewayRestApiConfig, "endpointConfiguration">;
    apiGatewayIntegrationProps: Omit<ApiGatewayIntegrationConfig, "restApiId"|"resourceId"|"httpMethod"|"type"|"uri">;
    cognitoUserPoolProps: CognitoUserPoolConfig;
    apiGatewayAuthorizerProps: Omit<ApiGatewayAuthorizerConfig, "type"|"restApiId">;
    apiGatewayResourceProps: Pick<ApiGatewayResourceConfig, "pathPart">;
    apiGatewayMethodProps: Omit<ApiGatewayMethodConfig, "restApiId"|"resourceId"|"authorization"|"authorizerId">;
}
export interface CognitoAPILambdaOutputs{
    functionArn: string;
    apiGatewayApiArn: string;
    cognitoUserPoolArn: string;
    apiGatewayAuthorizerId: string;
    apiGatewayResourceId: string;
    apiGatewayMethodId: string;
}

export class CognitoAPILambda {
    private _lambdaFunction: LambdaFunction;
    private _lambdaRestAPI: ApiGatewayRestApi;
    private _cognitoUserPool: CognitoUserPool;
    private _authorizer: ApiGatewayAuthorizer;
    private _resource: ApiGatewayResource;
    private _method: ApiGatewayMethod;

    constructor(scope: Construct, name: string, props: CognitoAPILambdaProps){
        this._lambdaFunction = new LambdaFunction(scope, name+'Lambda', props.lambdaFunctionProps)
        this._lambdaRestAPI = new ApiGatewayRestApi(scope, name+'GatewayApi', Object.assign(props.apiGatewayRestApiProps, {}))
        this._cognitoUserPool = new CognitoUserPool(scope, name+'UserPool', props.cognitoUserPoolProps)
        this._authorizer = new ApiGatewayAuthorizer(scope, name+'Authorizer', Object.assign(props.apiGatewayAuthorizerProps, {
            type: 'COGNITO_USER_POOLS',
            restApiId: this._lambdaRestAPI.id,
            providerArns: [this._cognitoUserPool.arn]
        }))
        this._resource = new ApiGatewayResource(scope, name+'GatewayResource', Object.assign(props.apiGatewayResourceProps, {
            parentId: this._lambdaRestAPI.id,
            restApiId: this._lambdaRestAPI.rootResourceId,
        }))
        this._method = new ApiGatewayMethod(scope, name+'GatewayMethod', Object.assign(props.apiGatewayMethodProps, {
            restApiId: this._lambdaRestAPI.id,
            resourceId: this._resource.id,
            authorization: 'COGNITO_USER_POOLS',
            authorizerId: this._authorizer.id,
        }))
        new ApiGatewayIntegration(scope, name+'GatewayIntegration', Object.assign(props.apiGatewayIntegrationProps, {
            restApiId: this._lambdaRestAPI.id,
            resourceId: this._resource.id,
            httpMethod: this._method.httpMethod,
            type: 'AWS_PROXY',
            uri: this._lambdaFunction.invokeArn,
        }))
    }
    public get arns():CognitoAPILambdaOutputs {
        return {
            functionArn: this._lambdaFunction.arn,
            apiGatewayApiArn: this._lambdaRestAPI.arn,
            apiGatewayAuthorizerId: this._authorizer.id,
            apiGatewayResourceId: this._resource.id,
            apiGatewayMethodId: this._method.id,
            cognitoUserPoolArn: this._cognitoUserPool.arn,
        }
    }
}