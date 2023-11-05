import { json, type ActionFunctionArgs, type MetaFunction, redirect } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { v4 } from "uuid";
import fs from "fs";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

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

  let chatUuid = v4();

  fs.readFile(jsonDirectory + "/chatRooms.json", "utf8", (err, data) => { 
    if (err) {
      console.log("An error occured while reading JSON Object");
      return;
    }
    const chatRooms = JSON.parse(data);
    chatRooms.rooms[chatUuid] = {
      "title": props.title,
      "messages": []
    }

    fs.writeFile(jsonDirectory + "/chatRooms.json", JSON.stringify(chatRooms), (err) => {
      if (err) {
        console.log("An error occured while writing JSON Object");
        console.log(err);
        return;
      }
      console.log("JSON file has been saved.");
    });
  });

  return chatUuid;
}


/* Runs on both the server and client */
export default function Index() {
  const actionData = useActionData<typeof action>();

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      <h1>Welcome to QuickChat!</h1>
      <h2> Click on 'create new chat' to get started</h2>
      
      <Form method="post"> 
        <input name="title" className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="chatName" type="text" placeholder="My super cool chat"></input>
        <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"> Create new Chat </button>
      </Form>

    </div>
  );
}

export async function action({
  request,
}: ActionFunctionArgs) {
  console.log("wowza");
  const body = await request.formData();
  const chatId = await createChat({ title: body.get("title") });

  return redirect(`/chat/${chatId}`);
}