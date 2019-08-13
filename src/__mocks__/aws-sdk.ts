const aws: any = jest.genMockFromModule("aws-sdk");

class CloudFormation {
  constructor() {}

  describeStacks(params) {
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

  deleteStack(_params) {
    return jest.fn(() => {});
  }
}

class DynamoDB {
  constructor() {}
  putItem() {
    return {
      promise: () => {
        return true;
      }
    };
  }

  updateItem() {
    return {
      promise: () => {
        return true;
      }
    };
  }

  deleteItem() {
    return {
      promise: () => {
        return true;
      }
    };
  }
}
aws.CloudFormation = CloudFormation;
aws.DynamoDB = DynamoDB;

module.exports = aws;
