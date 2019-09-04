import { APIGatewayEvent } from "aws-lambda";
import { BitbucketWebhookEvent, GitTag, State } from "stackjanitor";
import { dynamoDataModel } from "../data/DynamoDataModel";

const bitbucketEventParser = (eventData: BitbucketWebhookEvent): GitTag => ({
  repository: eventData.pullrequest.source.repository.name,
  branch: eventData.pullrequest.source.branch.name
});

const isBitbucketEvent = (event: any): event is BitbucketWebhookEvent =>
  event.pullrequest && event.repository;

const findStackFromTag = (gitTag: GitTag, keyName: string) => {
  return new Promise((resolve, reject) => {
    dynamoDataModel
      .scan()
      .where(keyName)
      .contains(gitTag.repository)
      .where(keyName)
      .contains(gitTag.branch)
      .exec((err, data) => {
        if (err) reject(err);
        resolve(data);
      });
  });
};

const isInDesiredState = (state: State) =>
  state !== State.Merged && state !== State.Declined;

export const index = async (event: APIGatewayEvent) => {
  const eventData = event.body;
  if (isBitbucketEvent(eventData)) {
    const state = eventData.pullrequest.state;
    const inDesiredState = isInDesiredState(state);
    const gitTag = bitbucketEventParser(eventData);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(eventData)
  };
};
