import {
  DataItem,
  DynamoDataModel,
  DynamoSearchResult,
  GitTag
} from "stackjanitor";
import { dataModel, dynamoDataModel } from "./data/DynamoDataModel";
import { handleDataItem } from "./handlers/monitorCloudFormationStack";

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

export const deleteDynamoRow = async (dataItem: DataItem) =>
  handleDataItem(
    {
      stackName: dataItem.stackName,
      stackId: dataItem.stackId
    },
    dataModel.destroy
  );
