import { fileURLToPath } from "url";
import { dirname } from "path";
import { Form } from "@remix-run/react";
import { LoaderFunctionArgs } from "@remix-run/node";
import fsPromises from "fs/promises";
import { useLoaderData } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";

interface IChat {
  id: string; // the uuid
}

export const loader = async ({ params }: LoaderFunctionArgs) => {
  // Connect to the websocket
  console.log("chatId: " + params.chatId);
  const chatDetails = await getExistingChat(params.chatId);
  console.log("chatDetails: " + chatDetails);
  if (!chatDetails) {
    throw new Response("Could not find chat with UUID", { status: 404 });
  }
  console.log("we probably did find the chat Id :)");
  return chatDetails;
};

async function getExistingChat(uuid: string) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const jsonDirectory = __dirname + "/../json";

  try {
    const data = await fsPromises.readFile(
      jsonDirectory + "/chatRooms.json",
      "utf8"
    );
    const chatRooms = JSON.parse(data);
    const room = chatRooms.rooms[uuid];
    return room || null;
  } catch (err) {
    console.error("An error occurred while reading JSON Object", err);
    return null;
  }
}

export default function Chat(props: IChat) {
  const room = useLoaderData<typeof loader>();
  const ws = useRef<WebSocket | null>(null);
  const [ message, setMessage ] = useState('');
  const [receivedMessages, setReceivedMessages] = useState<string[]>([]);

  useEffect(() => {
    ws.current = new WebSocket(`ws://localhost:8003/${room}`);
    ws.current.onopen = () => console.log("Connected to websocket");
    ws.current.onmessage = (event) => {
      console.log(event.data);
      const receivedMessage = JSON.parse(event.data);
      setReceivedMessages(prevMessages => [...prevMessages, receivedMessage]);
    };
    ws.current.onopen = () => console.log("ws opened");
    ws.current.onclose = () => console.log("ws closed");

    return () => {
      ws.current?.close();
    };
  }, [room.id]);

  const sendMessage = async(event: React.FormEvent) => {
    event.preventDefault();
    console.log("sending message: " + message);
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      console.log('wtf');
      console.log(message);
      ws.current.send(JSON.stringify({ message }));
    }
    setMessage('');
  };

  return (
    <div className="flex flex-col align-center">
      <h1> Welcome! </h1>
      <h1>Chat: {room.title}</h1>
      <ul>
        {receivedMessages.map((msg, index) => (
          <li key={index}>{msg.message}</li> // Display received messages
        ))}
      </ul>
      <Form onSubmit={sendMessage}>
        <input
          name="message"
          className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          id="chatMessage"
          type="text"
          placeholder="My super cool chat"
          onChange={e => setMessage(e.target.value)}
          value={message}
        ></input>
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        > Post 
        </button>
      </Form>
    </div>
  );
}
