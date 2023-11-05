import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { LoaderFunctionArgs } from '@remix-run/node';
import fs from 'fs';
import fsPromises from 'fs/promises';

import { useLoaderData } from '@remix-run/react';

interface IChat {
  id: string; // the uuid
}



export const loader = async({
    params,
}: LoaderFunctionArgs) => {
    console.log("chatId: " + params.chatId);
    const chatDetails = await getExistingChat(params.chatId);
    console.log("chatDetails: " + chatDetails);
    if (!chatDetails) {
        throw new Response("Could not find chat with UUID", { status: 404 });
    }
    console.log("we probably did find the chat Id :)")
    return chatDetails;
};

async function getExistingChat(uuid: string) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const jsonDirectory = __dirname + "/../json";

  try {
    const data = await fsPromises.readFile(jsonDirectory + "/chatRooms.json", "utf8");
    const chatRooms = JSON.parse(data);
    const room = chatRooms.rooms[uuid];
    return room || null;
  } catch (err) {
    console.error("An error occurred while reading JSON Object", err);
    return null; // or throw, depending on how you want to handle errors
  }
}

export default function Chat(props: IChat) {
    const room = useLoaderData<typeof loader>();
    return (
      <div>
        <h1> Welcome! </h1>
        <h1>Chat: {room.title}</h1>
      </div>
    )
}
