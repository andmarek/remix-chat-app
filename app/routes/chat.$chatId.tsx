import { fileURLToPath } from "url";
import { dirname } from "path";
import { Form } from "@remix-run/react";
import { LoaderFunctionArgs } from "@remix-run/node";
import fsPromises from "fs/promises";
import { useLoaderData } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
import { IChat } from "../interfaces/chat";
import { getSession, commitSession } from "~/sessions";



export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const session = await getSession(
    request.headers.get("Cookie")
  );
  console.log(session.has("userId"));
  const userId = session.get("userId");

  // get chat and chat metadata
  console.log("chatId:", params.chatId);

  const chatId = params.chatId || "";

  const chatDetails = await getExistingChat(chatId);
  console.log(userId);
  console.log("chatDetails:", chatDetails);

  if (!chatDetails) {
    throw new Response("Could not find chat with UUID " + params.chatId, { status: 404 });
  }

  return { userId: userId, chatId: chatId, chatDetails: chatDetails };
};


export default function Chat(props: IChat) {
  const loaderData = useLoaderData<typeof loader>();
  const userId = loaderData.userId;
  const chatId = loaderData.chatId;
  const chatDetails = loaderData.chatDetails;

  const [message, setMessage] = useState("");

  const ws = useRef<WebSocket | null>(null);

  const [currentMessages, setCurrentMessages] = useState<string[]>([]);

  useEffect(() => {
    console.log("Attempting to connect WebSocket");
    ws.current = new WebSocket(`ws://localhost:8003/${chatId}`);
  
    ws.current.onopen = () => {
      if (ws.current.readyState === WebSocket.OPEN) {
        console.log("WebSocket connection established");
      }
    };
  
    ws.current.onmessage = (event) => {
      console.log("Received message: " + event.data);
      const data = event.data;

      setCurrentMessages((prevMessages) => [...prevMessages, data]);
      console.log("currentMessages after: " + currentMessages);
    };
  
    ws.current.onerror = (event) => {
      console.error("WebSocket error observed:", event);
    };
  
    ws.current.onclose = (event) => {
      console.log("WebSocket closed:", event);
    };
  
    // Cleanup function to close websocket connection when component unmounts
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [chatId, userId]);

  const sendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    console.log("sending message: " + message);
    
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {

      const messageToSend = { "username": userId, "message": message }
      ws.current.send(JSON.stringify(messageToSend));

      // TODO: make the messages objects instead of strings so we can store the history
      setCurrentMessages((prevMessages) => [...prevMessages, `${userId}: ${messageToSend.message}`]);
      console.log(currentMessages);
    }
    setMessage("");
  };

  return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900">
        <div className="w-full max-w-2xl mx-auto bg-stone-950 shadow-lg rounded-lg">
          <div className="border-b-2 border-gray-200 p-4">
            <div className="flex flex-col">
              <h1 className="text-white text-3xl font-bold text-center"> Chatroom Name: {chatDetails.metadata.title}</h1>
              <h1 className="text-3xl font-bold text-center text-gray-700">Welcome, {userId}</h1>
            </div>
          </div>
          <ul className="overflow-auto h-96 bg-stone-950 p-4">
            {currentMessages.map((msg, index) => (
              <li key={index} className="bg-blue-100 rounded-md p-2 my-2 break-words">
                <p className="text-gray-800">{msg}</p> {/* Display received messages */}
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
