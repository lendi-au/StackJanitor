declare module "stackjanitor" {
  export type parameterValue = "Environment";

  export type parameterKey = {
    [parameterKey: string]: parameterValue;
  };

  export interface StackJanitorStatus {
    [Key: string]: any;
    event: CloudFormationEvent;
    results: {
      stackjanitor: string;
    };
  }

  export interface DataItem {
    expirationTime: number;
    stackId?: string;
    stackName: string;
    tags: string;
    deleteCount?: number;
  }

  export interface DeleteItem {
    stackId?: string;
    stackName: string;
  }

  export interface CustomTag {
    key: string;
    value: string;
  }

  export interface CloudFormationEvent {
    id: string;
    detail: {
      userIdentity: {
        type: string;
        sessionContext: {
          sessionIssuer: {
            userName: string;
          };
        };
      };
      eventName: string;
      eventTime: string;
      requestParameters: {
        tags: CustomTag[];
        parameters?: parameterKey[];
        stackName: string;
      };
      responseElements: null | {
        stackId: string;
      };
      errorCode?: string;
    };
  }

  export interface BitbucketWebhookEvent {
    pullrequest: {
      destination: RepositoryAndBranch;
      source: RepositoryAndBranch;
      state: State;
    };
    repository: Repository;
  }

  export const enum State {
    Merged = "MERGED",
    Declined = "DECLINED",
  }

  export interface Repository {
    name: string;
    fullname: string;
  }

  export interface RepositoryAndBranch {
    repository: Repository;
    branch: {
      name: string;
    };
  }

  export interface GitTag {
    repository: string;
    branch: string;
  }

  export interface DynamoSearchResult {
    Items: DataItem[];
  }

  export interface GithubWebhookEvent {
    action: string;
    pull_request: {
      state: string;
      head: {
        ref: string;
        repo: Repository;
      };
      base: {
        repo: Repository;
      };
      merged: boolean;
    };
    repository: Repository;
  }
}
