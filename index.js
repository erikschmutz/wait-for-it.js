const url = require("url");
const http = require("http");
const https = require("https");
const util = require("util");
const exec = util.promisify(require("child_process").exec);

const usage = `
Usage:
    wait-for-it host:port [-s] [-t timeout] [-- command args]
    -h=HOST | --host=HOST       Host or IP under test
    -p=PORT | --port=PORT       TCP port under test
                                Alternatively, you specify the host and port as host:port
    -s | --strict               Only execute subcommand if the test succeeds
    -q | --quiet                Don't output any status messages
    -t=TIMEOUT | --timeout=TIMEOUT
                                Timeout in seconds, zero for no timeout
    -z=SLEEP | --sleep=SLEEP
                                Sleeping time in seconds, zero for no sleep. Defaults to 
                                10 seconds
    
    -r=RETRY_COUNT | --retry=RETRY_COUNT
                                Amount of retries before fail. Defaults to 10
                                
    -- COMMAND ARGS             Execute command with args after the test finishes
`;

function error(msg) {
  console.error("Error: " + msg + usage);
  process.exit(1);
}

function getArg(args, long, short, hasValue) {
  const arg = args.find((arg) => arg.startsWith(long) || arg.startsWith(short));

  if (arg) {
    if (arg.split("=").length !== 2) {
      error(`bad format on ${long} or ${short}:`);
    }

    return arg.split("=")[1];
  }
}

function hasArg(args, long, short, hasValue) {
  return args.find((arg) => arg === long || arg === short);
}

const args = process.argv.slice(2);
const uri = args[0];
const host = getArg(args, "--host", "-h");
const port = getArg(args, "--port", "-p");
const timeout = getArg(args, "--timeout", "-t");
const sleep = getArg(args, "--sleep", "-z");
const quite = hasArg(args, "--quiet", "-q");
const strict = hasArg(args, "--strict", "-s");
const retry = getArg(args, "--retry", "-r");

const command = args.slice(args.indexOf("--") + 1).join(" ");

if (args.indexOf("--") === -1) {
  error("Command not provider");
}

if (!command) {
  error("Command not provider");
}

if (!uri) {
  error("No URI provided");
} else {
  if (!uri.includes(":")) {
    error("Bad formated URI");
  }
}

if (quite) {
  console.log = () => {};
}

(async function () {
  const parsed = url.parse(uri);

  const fetch = function (opt) {
    return new Promise((res, rej) => {
      const cb = (response) => {
        response.on("data", (chunk) => {
          res(chunk);
        });
      };

      if (parsed.protocol === "https:") {
        const req = https.request(opt, cb).end();
        req.on("error", function (e) {
          rej(e);
        });
      } else {
        const req = http.request(opt, cb).end();
        req.on("error", function (e) {
          rej(e);
        });
      }
    });
  };

  const threadSleep = function (s) {
    return new Promise((res) => {
      setTimeout(() => res(), s);
    });
  };

  const execute = () => {
    return exec(command)
      .then((v) => {
        if (v.stdout) console.log(v.stdout.slice(0, -1));
        if (v.stderr) console.error(v.stdout.slice(0, -1));
      })
      .catch((v) => {
        if (v) console.error(v.toString().slice(0, -1));
      });
  };

  let index = 0;
  let success;
  const s = (sleep || 10) * 1000;

  while (index < (retry || 10)) {
    if (port) host.port = port;
    if (host) host.host = host;

    success = false;
    console.log(`* trying to contact ${uri}...`);
    await fetch({ ...parsed, timeout: timeout })
      .then(() => {
        success = true;
      })
      .catch(() => {
        success = false;
      });

    if (success) {
      console.log(`${uri} is available after ${(index * s) / 1000}s`);
      break;
    } else {
      console.log(`waiting ${s / 1000}s for ${uri} to become responsive...`);
      await threadSleep(s);
    }

    index++;
  }

  if (!strict || success) {
    await execute();
  }
})();
