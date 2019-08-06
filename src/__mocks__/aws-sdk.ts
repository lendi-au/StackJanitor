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
}

const DynamoDB = {
  DocumentClient: class {
    constructor() {}
  }
};

module.exports = { CloudFormation, DynamoDB };
