import { StackName } from "aws-sdk/clients/cloudformation";

const aws: any = jest.genMockFromModule("aws-sdk");

class CloudFormation {
  constructor() {}

  describeStacks(params: { StackName: StackName }) {
    return {
      promise: () => ({
        Stacks: [
          {
            Tags: [
              {
                Key: `${params.StackName}`,
                Value: "enabled"
              }
            ]
          }
        ]
      })
    };
  }

  deleteStack(_params: { StackName: StackName }) {
    return jest.fn(() => {});
  }
}
aws.CloudFormation = CloudFormation;

module.exports = aws;
