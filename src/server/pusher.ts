import Pusher from "pusher";

let pusher: Pusher | undefined;

function requiredEnvironmentValue(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not configured`);
  }

  return value;
}

export function getPusherServer() {
  if (!pusher) {
    pusher = new Pusher({
      appId: requiredEnvironmentValue("PUSHER_APP_ID"),
      key: requiredEnvironmentValue("NEXT_PUBLIC_PUSHER_APP_KEY"),
      secret: requiredEnvironmentValue("PUSHER_SECRET"),
      cluster: requiredEnvironmentValue("NEXT_PUBLIC_PUSHER_CLUSTER"),
      useTLS: true,
    });
  }

  return pusher;
}
