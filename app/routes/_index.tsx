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

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

interface IChat {
  title: string;
}

async function createChat(props: IChat) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const jsonDirectory = __dirname + "/../json";

  let chatMd5 = md5(props.title);

  fs.readFile(jsonDirectory + "/chatRooms.json", "utf8", (err, data) => {
    if (err) {
      console.log("An error occured while reading JSON Object");
      return;
    }
    const chatRooms = JSON.parse(data);
    chatRooms.rooms[chatMd5] = {
      title: props.title,
      messages: [],
    };

    fs.writeFile(
      jsonDirectory + "/chatRooms.json",
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

  return chatMd5;
}

export const loader = async ({ params }: LoaderFunctionArgs) => {
  console.log("chatId: " + params.chatId);
  const chatDetails = await getExistingChats(params.chatId);
  console.log("chatDetails: " + chatDetails);
  if (!chatDetails) {
    throw new Response("Could not find chat with UUID", { status: 404 });
  }
  console.log("we probably did find the chat Id :)");
  return chatDetails;
};

export default function Index() {
  const existingChats = useLoaderData<typeof loader>();

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
              {Object.keys(existingChats.rooms).map((chatId, index) => {
                let bgColor = index % 2 === 0 ? "bg-slate-400" : "bg-slate-500";
                return (
                  <li className={`${bgColor} hover:text-red-500 duration-300`} key={chatId}>
                    <a href={`/chat/${chatId}`}>
                      {existingChats.rooms[chatId].title}
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
        <div>
        </div>
      </div>
    </div>
  );
}

export async function action({ request }: ActionFunctionArgs) {
  console.log("wowza");
  const body = await request.formData();
  const chatId = await createChat({ title: body.get("title") });

  return redirect(`/chat/${chatId}`);
}

async function getExistingChats(uuid: string) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const jsonDirectory = __dirname + "/../json";

  try {
    const data = await fsPromises.readFile(
      jsonDirectory + "/chatRooms.json",
      "utf8"
    );
    const chatRooms = JSON.parse(data);
    return chatRooms;
    return uuid || null;
  } catch (err) {
    console.error("An error occurred while reading JSON Object", err);
    return null;
  }
}
