implement all the configuration and the initial index please. 
then we will create the actions. 
I want full typescript with strict typing in the files itself so all will be under control:
I want the import of the environment variables that i also post here directly in the action files. 
I want all to be very clean and very simple and separated by docstring. 
I want also you to use the logger in debug mode (eliza provide is as logger in the import) to create a very granualr logging of all the steps. 

now here i add you the endpoints and the results when i dry in the doc of the API

Get Available Workload Types
/api/v0/types

@https://api.comput3.ai/api/v0/types 

	
Response body

	

List of available workload types

    Example Value
    Model

[
  "string"
]

real response
[
  "media:fast",
  "ollama_webui:coder",
  "ollama_webui:fast",
  "ollama_webui:large"
]
curl -X GET "https://api.comput3.ai/api/v0/types" -H  "accept: application/json"


Get user balance (to use together with the get user profile)
/api/v0/balance

@https://api.comput3.ai/api/v0/balance 

	
Response body
{
  "balance": 363642
}
curl -X GET "https://api.comput3.ai/api/v0/balance" -H  "accept: application/json" -H  "X-C3-API-KEY: c3_api_pwGdWJHg192FrUHqB34OObz8"


get user profile (to use together with the get user balance)
/api/v0/profile
@https://api.comput3.ai/api/v0/profile 

	
Response body
{
  "addr": "84oWfZSa2ABSEKKLqcsA4UNKqKz1WPVxNGftkRjDEJEg",
  "tags": [],
  "user_uuid": "7417d3d2-3aee-42f9-afde-7de57db1456e"
}

User profile information

    Example Value
    Model

{
  "addr": "string",
  "tags": [
    "string"
  ],
  "user_uuid": "string"
}
curl -X GET "https://api.comput3.ai/api/v0/profile" -H  "accept: application/json" -H  "X-C3-API-KEY: c3_api_pwGdWJHg192FrUHqB34OObz8"

IMPORTANT SECTION WHERE WE ACTUALLY DO SOMETHING. 

launch a workload
/api/v0/launch
@https://api.comput3.ai/api/v0/launch 

body (example with data)

{
  "expires": 10,
  "type": "ollama_webui:coder"
}
model 

    Model

{
expires*	integer

Expiration timestamp
type*	string

Workload type
}


{
  "node": "string",
  "workload": "string",
  "workload_key": "string"
}

here i provide you also the curl 
curl -X POST "https://api.comput3.ai/api/v0/launch" -H  "accept: application/json" -H  "X-C3-API-KEY: c3_api_pwGdWJHg192FrUHqB34OObz8" -H  "Content-Type: application/json" -d "{  \"expires\": 10,  \"type\": \"ollama_webui:coder\"}"

stop a workload 

@https://api.comput3.ai/api/v0/stop 

body 
{
  "workload": "string"
}

{
workload*	string

Workload ID to stop
}

is the workload id that is probably the workload_key of the workload creation.

also the curl 
curl -X POST "https://api.comput3.ai/api/v0/stop" -H  "accept: application/json" -H  "X-C3-API-KEY: c3_api_pwGdWJHg192FrUHqB34OObz8" -H  "Content-Type: application/json" -d "{  \"workload\": \"string\"}"

but we will test later with a real ID from the platform.

then 

the list
@https://api.comput3.ai/api/v0/workloads 

the body 

{
  "running": true
}


	

List of user's workloads

    Example Value
    Model

[
  {
    "created": 0,
    "expires": 0,
    "node": "string",
    "running": true,
    "status": "string",
    "type": "string",
    "workload": "string"
  }
]

the curl 
curl -X POST "https://api.comput3.ai/api/v0/workloads" -H  "accept: application/json" -H  "X-C3-API-KEY: c3_api_pwGdWJHg192FrUHqB34OObz8" -H  "Content-Type: application/json" -d "{  \"running\": true}"

we will test later once we have a workload active and running. 

Please

