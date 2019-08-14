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

const DynamoDB = {
  DocumentClient: class {
    constructor() {}
    put() {
      return {
        promise: () => true
      };
    }

    update() {
      return {
        promise: () => true
      };
    }

    delete() {
      return {
        promise: () => true
      };
    }
  }
};

aws.CloudFormation = CloudFormation;
aws.DynamoDB = DynamoDB;

module.exports = aws;
