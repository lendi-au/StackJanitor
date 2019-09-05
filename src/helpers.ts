import {
  DataItem,
  DynamoDataModel,
  DynamoSearchResult,
  GitTag
} from "stackjanitor";
import { dynamoDataModel } from "./data/DynamoDataModel";

export const findStacksFromTag = (
  gitTag: GitTag,
  keyName: string
): Promise<DataItem[]> =>
  new Promise((resolve, reject) =>
    dynamoDataModel
      .scan()
      .where(keyName)
      .contains(gitTag.repository)
      .where(keyName)
      .contains(gitTag.branch)
      .exec((err, data: DynamoSearchResult) =>
        err
          ? reject(err)
          : resolve(data.Items.map((item: DynamoDataModel) => item.attrs))
      )
  );
