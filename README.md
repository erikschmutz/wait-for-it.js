# wait-for-it.js

Zero dependency of the wait-for-it.sh script.

    Usage:
    wait-for-it host:port [-s] [-t timeout] [-- command args]

        -h=HOST | --host=HOST Host or IP under test
        -p=PORT | --port=PORT TCP port under test
    Alternatively, you specify the host and port as host:port

        -s | --strict Only execute subcommand if the test succeeds
        -q | --quiet Don't output any status messages
        -t=TIMEOUT | --timeout=TIMEOUT
    	    Timeout in seconds, zero for no timeout

        -z=SLEEP | --sleep=SLEEP
            Sleeping time in seconds, zero for no sleep. Defaults to 10 seconds

        -r=RETRY_COUNT | --retry=RETRY_COUNT Amount of retries before fail.
        Defaults to 10
    -- COMMAND ARGS Execute command with args after the test finishes
