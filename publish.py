#!/usr/bin/env python

import base64
import json
import os
import requests
import sys

# todo: provide oauth client id to google api
# and store client secret/token

# curl "https://accounts.google.com/o/oauth2/token" -d \
# "client_id=$CLIENT_ID&client_secret=$CLIENT_SECRET&code=$CODE&grant_type=authorization_code&redirect_uri=urn:ietf:wg:oauth:2.0:oob"
result = requests.post('https://accounts.google.com/o/oauth2/token',
    data={
            'client_id': os.environ["CHROME_CLIENT_ID"],
            'client_secret': os.environ["CHROME_CLIENT_SECRET"],
            'code': os.environ["CHROME_CODE"],
            'grant_type': 'authorization_code',
            'redirect_uri': 'urn:ietf:wg:oauth:2.0:oob'
        }
    )

if result.status_code != requests.codes.ok:
    print(f'Error: {result.text}')
    sys.exit(1)

#result_json = 
import pdb; pdb.set_trace()
access_token = result['access_token']

'''
file_contents = open(sys.argv[1], 'rb').read()
encoded_contents = base64.b64encode(file_contents)
payload = encoded_contents
hostname = os.environ['SOAR_HOSTNAME']
result = requests.post('https://accounts.google.com/o/oauth2/token',
                       data=payload)

print(result.text)

if result.status_code != requests.codes.ok or 'failed' in result.json():
    sys.exit(1)
'''
