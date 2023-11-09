import { fileURLToPath } from "url";
import { dirname } from "path";
import { Form } from "@remix-run/react";
import { LoaderFunctionArgs } from "@remix-run/node";
import fsPromises from "fs/promises";
import { useLoaderData } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
import { IChat } from "../interfaces/chat";



export const loader = async ({ params }: LoaderFunctionArgs) => {
  // get chat and chat metadata
  console.log("chatId:", params.chatId);
  const chatDetails = await getExistingChat(params.chatId);

  console.log("chatDetails:", chatDetails);

  if (!chatDetails) {
    throw new Response("Could not find chat with UUID " + params.chatId, { status: 404 });
  }

  console.log("We probably did find the chat Id :)");
  return chatDetails;
};


export default function Chat(props: IChat) {
  const room = useLoaderData<typeof loader>();
  const [setUsername, username] = useState("");
  const ws = useRef<WebSocket | null>(null);
  const [message, setMessage] = useState("");
  const [receivedMessages, setReceivedMessages] = useState<string[]>([]);

  useEffect(() => {
    console.log("this is useeffect");
    ws.current = new WebSocket(`ws://localhost:8003/${room}`);
    ws.current.onopen = () => {
      console.log("WTFFFFF");
      if (ws.current.readyState === WebSocket.OPEN) {
        ws.current?.send(
          JSON.stringify({ type: "username", username: "hello" })
        );
      }
      console.log("Connected to websocket");
    };
    ws.current.onmessage = (event) => {
      console.log(event.data);
      const receivedMessage = JSON.parse(event.data);
      setReceivedMessages((prevMessages) => [...prevMessages, receivedMessage]);
    };
  }, [room.id]);

  const sendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    console.log("sending message: " + message);
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ message }));
    }
    setMessage("");
  };

  return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="w-full max-w-2xl mx-auto bg-white shadow-lg rounded-lg">
          <div className="border-b-2 border-gray-200 p-4">
            <h1 className="text-3xl font-bold text-center text-gray-700">Welcome to Chat: {room.metadata.title}</h1>
          </div>
          <ul className="overflow-auto h-96 bg-gray-50 p-4">
            {receivedMessages.map((msg, index) => (
              <li key={index} className="bg-blue-100 rounded-md p-2 my-2 break-words">
                <p className="text-gray-800">{msg.message}</p> {/* Display received messages */}
              </li>
            ))}
          </ul>
          <div className="p-4 bg-white">
            <Form onSubmit={sendMessage} className="flex items-center">
              <input
                name="message"
                className="flex-1 border border-gray-300 rounded-l-md py-2 px-4 text-gray-700 focus:outline-none focus:border-blue-500"
                id="chatMessage"
                type="text"
                placeholder="Type your message..."
                onChange={(e) => setMessage(e.target.value)}
                value={message}
              />
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-r-md"
              >
                Send
              </button>
            </Form>
          </div>
        </div>
      </div>
    );
}

async function getExistingChat(uuid: string) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const jsonDirectory = __dirname + "/../json";

  try {
    const data = await fsPromises.readFile(
      jsonDirectory + "/chatRooms2.json",
      "utf8"
    );
    const chatRooms = JSON.parse(data);
    const chatDetails: IChat = chatRooms[uuid];
    return chatDetails || null
  } catch (err) {
    console.error("An error occurred while reading JSON Object", err);
    return null;
  }
}
