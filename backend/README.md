# Entra ID Change Detection Project

This project requires the following setup to run.

## Environment Variables
Create a `.env` file in the root directory with the following variables:
GRAPH_SCOPE='https://graph.microsoft.com/.default'
GRAPH_CONFIG_ENDPOINT='https://graph.microsoft.com/v1.0'


## Docker Secrets
This project uses Docker Secrets. The following secret files must be created and placed in a directory. The path to this directory should be set in a host environment variable called `SECRETS_DIR`.

- `graph_tenant_id.txt`
- `graph_client_id.txt`
- `graph_client_secret.txt`
