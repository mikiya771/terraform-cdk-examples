import { Construct } from 'constructs';
import { App, TerraformStack } from 'cdktf';
import { CognitoAPILambda } from './cognito-api-lambda';
import { DataArchiveFile } from './.gen/providers/archive'
import { IamRole } from './.gen/providers/aws';

class MyStack extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    // define resources here
    const code = new DataArchiveFile(this, name, {
      type: 'zip',
      sourceDir: '${path.root}/src',
      outputPath: '${path.root}/src/helloWorld.zip',
    })
    const iam = new IamRole(this, name+'iam', {
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: "sts:AssumeRole",
            Principal: {
              Service: "lambda.amazonaws.com"
            },
            Effect: "Allow",
            Sid: "lambda"
          }
        ]
      })
    })
    new CognitoAPILambda(this, name, {
      lambdaFunctionProps: {
        functionName: 'helloWorld',
        filename: '${path.root}/src/helloWorld.zip',
        sourceCodeHash: code.outputBase64Sha256,
        handler: 'helloworld.handler',
        runtime: "nodejs12.x",
        role: iam.arn,
      },
      apiGatewayRestApiProps: {
          name: 'helloWorld',
      },
      apiGatewayIntegrationProps: {},
      cognitoUserPoolProps: {
        name: 'helloWorld',
      },
      apiGatewayAuthorizerProps:  {
        name: 'helloWorld',
      },
      apiGatewayResourceProps: {
        pathPart: 'helloWorld',
      },
      apiGatewayMethodProps: {
        httpMethod: 'GET',
      },
    })
  }
}

const app = new App();
new MyStack(app, 'cognito-api-lambda');
app.synth();
