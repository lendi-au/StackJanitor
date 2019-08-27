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

class DynamoDB {
  constructor() {}
  putItem() {
    return {
      promise: () => true
    };
  }

  updateItem() {
    return {
      promise: () => true
    };
  }

  deleteItem() {
    return {
      promise: () => true
    };
  }
}
aws.CloudFormation = CloudFormation;
aws.DynamoDB = DynamoDB;

module.exports = aws;
