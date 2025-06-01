#!/bin/bash

LOG_FILE="packages/plugin-datai/scripts/curls_logs.txt"
TMP_OUTPUT_FILE="packages/plugin-datai/scripts/curl_temp_output.tmp"
FAILED_REQUESTS=() # Array to store details of failed requests

# Clear log file
> "$LOG_FILE"

echo "Starting cURL tests... Log will be saved to $LOG_FILE" | tee -a "$LOG_FILE"

# Function to execute and log a cURL command
run_curl_test() {
    local action_name="$1"
    local curl_command_display="$2"
    # Remove " | cat" for actual execution and store the core command
    local curl_command_exec=$(echo "$curl_command_display" | sed 's/ | cat$//')

    echo -e "\\n===== Testing: $action_name =====" | tee -a "$LOG_FILE"
    echo "Command: $curl_command_display" | tee -a "$LOG_FILE"

    # Execute curl:
    # -o "$TMP_OUTPUT_FILE": sends body to temp file
    # -w "%{http_code}": writes HTTP status to stdout
    # -s: silent mode
    # The output of this command (the HTTP status) is captured by $()
    HTTP_STATUS_CODE=$(eval "$curl_command_exec" -o "$TMP_OUTPUT_FILE" -w "%{http_code}" -s)
    CMD_EXIT_CODE=$? # Exit code of the eval command (which ran curl)

    echo "Curl command exit code: $CMD_EXIT_CODE" | tee -a "$LOG_FILE"
    echo "HTTP Status Code: $HTTP_STATUS_CODE" | tee -a "$LOG_FILE"
    
    echo -e "\\nResponse Body (first 500 chars) from $TMP_OUTPUT_FILE:" | tee -a "$LOG_FILE"
    if [ -f "$TMP_OUTPUT_FILE" ]; then
        head -c 500 "$TMP_OUTPUT_FILE" | tee -a "$LOG_FILE"
        # Add a newline if head printed something, to separate from next log line
        if [ -s "$TMP_OUTPUT_FILE" ]; then echo; fi
    else
        echo "No output file created." | tee -a "$LOG_FILE"
    fi

    # Check for failure: curl command error OR HTTP status not 2xx (and not 000 for no response)
    if [ "$CMD_EXIT_CODE" -ne 0 ] || ( ! [[ "$HTTP_STATUS_CODE" =~ ^2[0-9][0-9]$ ]] && [ "$HTTP_STATUS_CODE" != "000" ] ); then
      FAILED_REQUESTS+=("Action: $action_name | HTTP Status: $HTTP_STATUS_CODE | Curl Exit Code: $CMD_EXIT_CODE | Command: $curl_command_display")
      echo "Status: FAILED" | tee -a "$LOG_FILE"
    else
      echo "Status: PASSED" | tee -a "$LOG_FILE"
    fi

    rm -f "$TMP_OUTPUT_FILE"
    echo -e "\\n===== End Test: $action_name =====\\n" | tee -a "$LOG_FILE"
}

# Action: GET_ALL_USER_DEFI_POSITIONS
run_curl_test "GET_ALL_USER_DEFI_POSITIONS_DATAI" "curl -X GET -H \"Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS\" \"https://api-v1.mymerlin.io/api/merlin/public/userDeFiPositions/all/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045\" | cat"

# Action: GET_USER_DEFI_POSITIONS_BY_CHAIN
run_curl_test "GET_USER_DEFI_POSITIONS_BY_CHAIN" "curl -X GET -H \"Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS\" \"https://api-v1.mymerlin.io/api/merlin/public/userDeFiPositions/0x09CF915e195aF33FA7B932C253352Ae9FBdB0106?chain=arb\" | cat"

# Action: GET_USER_DEFI_POSITIONS_BY_MULTIPLE_CHAINS
run_curl_test "GET_USER_DEFI_POSITIONS_BY_MULTIPLE_CHAINS" "curl -X GET -H \"Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS\" \"https://api-v1.mymerlin.io/api/merlin/public/userDeFiPositionsByChains/0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50?chains=avax,arb\" | cat"

# Action: GET_USER_DEFI_POSITIONS_BY_PROTOCOL
run_curl_test "GET_USER_DEFI_POSITIONS_BY_PROTOCOL" "curl -X GET -H \"Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS\" \"https://api-v1.mymerlin.io/api/merlin/public/userDeFiPositions/protocol/0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50?chain=avax&protocol=avax_gmx\" | cat"

# Action: GET_USER_DEFI_PROTOCOL_BALANCES_BY_CHAIN
run_curl_test "GET_USER_DEFI_PROTOCOL_BALANCES_BY_CHAIN" "curl -X GET -H \"Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS\" \"https://api-v1.mymerlin.io/api/merlin/public/balances/protocol/0x09CF915e195aF33FA7B932C253352Ae9FBdB0106?chain=eth\" | cat"

# Action: GET_USER_OVERALL_BALANCE_ALL_CHAINS
run_curl_test "GET_USER_OVERALL_BALANCE_ALL_CHAINS" "curl -X GET -H \"Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS\" \"https://api-v1.mymerlin.io/api/merlin/public/balances/all/0x09CF915e195aF33FA7B932C253352Ae9FBdB0106\" | cat"

# Action: GET_USER_OVERALL_BALANCE_BY_CHAIN
run_curl_test "GET_USER_OVERALL_BALANCE_BY_CHAIN" "curl -X GET -H \"Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS\" \"https://api-v1.mymerlin.io/api/merlin/public/balances/chain/0x21dd5c13925407e5bcec3f27ab11a355a9dafbe3?chain=avax\" | cat"

# Action: GET_WALLET_BALANCES_BY_CHAIN
run_curl_test "GET_WALLET_BALANCES_BY_CHAIN" "curl -X GET -H \"Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS\" \"https://api-v1.mymerlin.io/api/merlin/public/balances/0x3764D79db51726E900a1380055F469eB6e2a7fD3?chain=matic\" | cat"

# Action: GET_NATIVE_TOKEN_BALANCE_BY_CHAIN
run_curl_test "GET_NATIVE_TOKEN_BALANCE_BY_CHAIN" "curl -X GET -H \"Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS\" \"https://api-v1.mymerlin.io/api/merlin/public/balances/native/0x3764D79db51726E900a1380055F469eB6e2a7fD3?chain=eth\" | cat"

# Action: GET_TOKEN_BALANCES_BY_CHAIN
run_curl_test "GET_TOKEN_BALANCES_BY_CHAIN" "curl -X GET -H \"Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS\" \"https://api-v1.mymerlin.io/api/merlin/public/balances/token/0x3764D79db51726E900a1380055F469eB6e2a7fD3?chain=base\" | cat"

# Action: GET_GROUPED_TOKEN_BALANCES_BY_MULTIPLE_CHAINS_DATAI
run_curl_test "GET_GROUPED_TOKEN_BALANCES_BY_MULTIPLE_CHAINS_DATAI" "curl -X GET -H \"Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS\" \"https://api-v1.mymerlin.io/api/merlin/public/balances/chains/token/0x3764D79db51726E900a1380055F469eB6e2a7fD3?chains=base,eth\" | cat"

# Action: GET_USER_NFTS_LIST
run_curl_test "GET_USER_NFTS_LIST" "curl -X GET -H \"Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS\" \"https://api-v1.mymerlin.io/api/merlin/public/balances/nft/all/0x3764D79db51726E900a1380055F469eB6e2a7fD3\" | cat"

# Action: GET_USER_NFTS_BY_CHAIN
run_curl_test "GET_USER_NFTS_BY_CHAIN" "curl -X GET -H \"Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS\" \"https://api-v1.mymerlin.io/api/merlin/public/balances/nft/chain/0x3764D79db51726E900a1380055F469eB6e2a7fD3?chain=matic\" | cat"

# Action: GET_USER_TRANSACTIONS
run_curl_test "GET_USER_TRANSACTIONS" "curl -X GET -H \"Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS\" \"https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/history/all/extended/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045?limit=5\" | cat"

# Action: GET_USER_TX_HISTORY_ALL_CHAINS_SHORT
run_curl_test "GET_USER_TX_HISTORY_ALL_CHAINS_SHORT" "curl -X GET -H \"Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS\" \"https://api-v1.mymerlin.io/api/merlin/public/userTx/history/all/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045?limit=10\" | cat"

# Action: GET_USER_TRANSACTIONS_BY_CHAIN
run_curl_test "GET_USER_TRANSACTIONS_BY_CHAIN" "curl -X GET -H \"Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS\" \"https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/history/chain/extended/0x8e9741f27b21d6b3d5791b5566a880ecf5a1f21e?chain=eth&limit=10\" | cat"

# Action: GET_USER_TX_HISTORY_BY_CHAIN_RAW_LABEL
run_curl_test "GET_USER_TX_HISTORY_BY_CHAIN_RAW_LABEL" "curl -X GET -H \"Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS\" \"https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/history/chain/rawlabel/0x8e9741f27b21d6b3d5791b5566a880ecf5a1f21e?chain=eth&limit=10\" | cat"

# Action: GET_SOLANA_USER_TX_HISTORY_EXTENDED
run_curl_test "GET_SOLANA_USER_TX_HISTORY_EXTENDED" "curl -X GET -H \"Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS\" \"https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/history/all/extended/rTXw3t2M9CowfNy23AVtvnnGvve2VbHtH9AcRRzrXyJ?chain=solana&limit=5\" | cat"

# Action: GET_SOLANA_USER_TX_HISTORY_SHORT
run_curl_test "GET_SOLANA_USER_TX_HISTORY_SHORT" "curl -X GET -H \"Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS\" \"https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/history/all/HM7A27keP6GtwQ2nRCgstb2UhveG5SDTvM7aHJadRb2g?chain=solana&limit=5\" | cat"

# Action: GET_USER_TX_BY_PERIOD_ALL_CHAINS_EXTENDED
run_curl_test "GET_USER_TX_BY_PERIOD_ALL_CHAINS_EXTENDED" "curl --location \"https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/period/all/extended/0x9a25d79ab755718e0b12bd3c927a010a543c2b31?startTime=1703999553&endTime=1698729153\" --header \"Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS\" | cat"

# Action: GET_USER_TX_BY_PERIOD_AND_CHAIN_EXTENDED
run_curl_test "GET_USER_TX_BY_PERIOD_AND_CHAIN_EXTENDED" "curl --location \"https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/period/chain/extended/0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50?startTime=1716346533&endTime=1705895733&chain=xdai\" --header \"Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS\" | cat"

# Action: GET_USER_TX_BY_PERIOD_AND_CHAIN_RAW_LABEL_20
run_curl_test "GET_USER_TX_BY_PERIOD_AND_CHAIN_RAW_LABEL_20" "curl --location \"https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/period/chain/rawlabel/20/0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50?chain=eth&startTime=1716346533&endTime=1705895733\" --header \"Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS\" | cat"

# Action: GET_TRANSACTION_BY_HASH
run_curl_test "GET_TRANSACTION_BY_HASH" "curl -X GET -H \"Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS\" \"https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/byHash/eth/0xd4cd05342193d605764dcef1648b4f69fb90b2e4c7e315b7956fa0848cd727bf/0x218e312fF5181290A46e3f87A73A8aD40C05A944\" | cat"

# Action: GET_TRANSACTION_TRANSFERS_BY_HASH
run_curl_test "GET_TRANSACTION_TRANSFERS_BY_HASH" "curl -X GET -H \"Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS\" \"https://api-v1.mymerlin.io/api/merlin/public/v2/userTxTransfers/byHash/eth/0xd4cd05342193d605764dcef1648b4f69fb90b2e4c7e315b7956fa0848cd727bf/0x218e312fF5181290A46e3f87A73A8aD40C05A944\" | cat"

# Action: GET_TRANSACTIONS_FOR_DEFI_POSITION
run_curl_test "GET_TRANSACTIONS_FOR_DEFI_POSITION" "curl -X GET -H \"Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS\" \"https://api-v1.mymerlin.io/api/merlin/public/userTx/position/?position=compound__lending:compound-0xc00e94cb662c3520282e6f5717214004a7f26888:0x3764d79db51726E900a1380055F469eB6e2a7fD3:0\" | cat"

# Action: GET_USER_TRANSACTION_OVERVIEW
run_curl_test "GET_USER_TRANSACTION_OVERVIEW" "curl -X GET -H \"Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS\" \"https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/overview/0x4f2083f5fbede34c2714affb3105539775f7fe64\" | cat"


# Summary of failed requests
if [ ${#FAILED_REQUESTS[@]} -gt 0 ]; then
    echo -e "\\n===== SUMMARY OF FAILED REQUESTS =====" | tee -a "$LOG_FILE"
    for failed_req in "${FAILED_REQUESTS[@]}"; do
        echo "$failed_req" | tee -a "$LOG_FILE"
    done
    echo -e "\\nTotal failed requests: ${#FAILED_REQUESTS[@]}" | tee -a "$LOG_FILE"
else
    echo -e "\\n===== ALL cURL TESTS PASSED! =====" | tee -a "$LOG_FILE"
fi

echo -e "\\nAll tests finished. Log saved to $LOG_FILE"
