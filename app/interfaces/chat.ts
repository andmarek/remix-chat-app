export interface IChat {
  id: string; // the uuid
}

export interface IChatMetaData {
  title: string;
  dateCreated: string;
}
export interface IMessage {
  username: string;
  text: string;
  dateCreated: string;
}

export interface IUpdatedChat {
  metadata: IChatMetaData;
  messages: IMessage[];
  usersConnected: string[];
}
