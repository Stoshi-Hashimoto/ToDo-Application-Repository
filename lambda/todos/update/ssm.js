const { SSMClient, GetParametersCommand } = require("@aws-sdk/client-ssm");

const ssm = new SSMClient({ region: "ap-northeast-1" });

let cachedDbConfig = null;

async function getDbConfig() {
  console.log("SSM START");
  if (cachedDbConfig) {
    console.log("CACHE HIT");
    return cachedDbConfig;
  }

  const command = new GetParametersCommand({
    Names: [
      "/todo/dev/db/host",
      "/todo/dev/db/name",
      "/todo/dev/db/user",
      "/todo/dev/db/password",
      "/todo/dev/db/port",
    ],
    WithDecryption: true,
  });

  console.log("BEFORE SSM SEND");

  const response = await ssm.send(command);

  console.log("AFTER SSM SEND");

  const params = {};
  for (const param of response.Parameters) {
    params[param.Name] = param.Value;
  }

  cachedDbConfig = {
    host: params["/todo/dev/db/host"],
    database: params["/todo/dev/db/name"],
    user: params["/todo/dev/db/user"],
    password: params["/todo/dev/db/password"],
    port: Number(params["/todo/dev/db/port"]),
    ssl: {
      rejectUnauthorized: false,
    },
  };

  return cachedDbConfig;
}

module.exports = {
  getDbConfig,
};
