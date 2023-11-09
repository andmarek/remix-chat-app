import { useState, useEffect } from "react";
import {
  type ActionFunctionArgs,
  LoaderFunctionArgs,
  type MetaFunction,
  redirect,
} from "@remix-run/node";
import md5 from "md5";
import { Form, Link, useActionData, useLoaderData } from "@remix-run/react";
import { v4 } from "uuid";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import fsPromises from "fs/promises";

import { IChat } from "../interfaces/chat";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

interface createChatProps {
  title: string;
}
async function createChat(props: createChatProps) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const jsonDirectory = __dirname + "/../json";

  let chatRoomHash = md5(props.title);

  fs.readFile(jsonDirectory + "/chatRooms2.json", "utf8", (err, data) => {
    if (err) {
      console.log("An error occured while reading JSON Object");
      return;
    }

    const chatRooms = JSON.parse(data);

    chatRooms[chatRoomHash] = {
      metadata: {
        title: props.title,
        dateCreated: Date.now(),
      },
      messages: {},
      usersConnected: []
    };

    fs.writeFile(
      jsonDirectory + "/chatRooms2.json",
      JSON.stringify(chatRooms),
      (err) => {
        if (err) {
          console.log("An error occured while writing JSON Object");
          console.log(err);
          return;
        }
        console.log("JSON file has been saved.");
      }
    );
  });

  return chatRoomHash;
}

export const loader = async ({ params }: LoaderFunctionArgs) => {
  console.log("chatId: " + params.chatId);
  const existingChats = await getExistingChats({table: "chatRooms2"});

  console.log("chatDetails: " + existingChats);
  if (!existingChats) {
    throw new Response("Could not find chat with UUID", { status: 404 });
  }
  console.log("we probably did find the chat Id :)");
  return existingChats;
};

export default function Index() {
  const existingChats = useLoaderData<typeof loader>();
  console.log(existingChats)

  const actionData = useActionData<typeof action>();

  return (
    <div className="flex">
      <div className="bg-slate-500">
        <div>
          <h2 className=" text-slate-400 hover:text-sky-400">
            {" "}
            Existing Chats{" "}
          </h2>
        </div>
        <div>
          {
            <ul>
              {Object.keys(existingChats).map((chatId, index) => {
                let bgColor = index % 2 === 0 ? "bg-slate-400" : "bg-slate-500";
                return (
                  <li
                    className={`${bgColor} hover:text-red-500 duration-300`}
                    key={chatId}
                  >
                    <a href={`/chat/${chatId}`}>
                      {existingChats[chatId].metadata.title}
                    </a>
                  </li>
                );
              })}
            </ul>
          }
        </div>
      </div>
      <div
        className="flex flex-col"
        style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}
      >
        <h1>Welcome to QuickChat!</h1>
        <h2> Click on 'create new chat' to get started</h2>

        <Form method="post">
          <input
            name="title"
            className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="chatName"
            type="text"
            placeholder="My super cool chat"
          ></input>
          <input
            name="username"
            className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="username"
            type="text"
            placeholder="Enter a username"
          ></input>
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            {" "}
            Create new Chat{" "}
          </button>
        </Form>
        <div></div>
      </div>
    </div>
  );
}

export async function action({ request }: ActionFunctionArgs) {
  const body = await request.formData();
  const title = body.get("title");

  if (title === null || typeof title !== 'string') {
    throw new Error('Title is missing in the form data');
  }

  const chatId = await createChat({ title });

  return redirect(`/chat/${chatId}`);
}

async function getExistingChats(props: {table: string}) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const jsonDirectory = __dirname + "/../json";

  try {
    const data = await fsPromises.readFile(
      jsonDirectory + `/${props.table}.json`,
      "utf8"
    );
    const chatRooms = JSON.parse(data);
    return chatRooms || null;
  } catch (err) {
    console.error("An error occurred while reading JSON Object", err);
    return null;
  }
}
