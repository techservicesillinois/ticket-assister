#!/usr/bin/env python

import base64
import json
import os
import requests
import sys

# todo: provide oauth client id to google api
# and store client secret/token

file_contents = open(sys.argv[1], 'rb').read()
encoded_contents = base64.b64encode(file_contents)
payload = encoded_contents
headers = {'ph-auth-token': os.environ['SOAR_TOKEN']}
hostname = os.environ['SOAR_HOSTNAME']
result = requests.post(f'https://{hostname}/rest/app',
                       headers=headers,
                       data=payload)

print(result.text)

if result.status_code != requests.codes.ok or 'failed' in result.json():
    sys.exit(1)