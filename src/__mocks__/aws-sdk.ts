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

  deleteStack(_params) {}
}

const DynamoDB = {
  DocumentClient: class {
    constructor() {}
  }
};

module.exports = { CloudFormation, DynamoDB };
