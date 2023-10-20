#!/usr/bin/env python

import base64
import os
import requests
import sys

# https://developer.chrome.com/docs/webstore/using_webstore_api/

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
    print(f'Error {result.status_code}: {result.text}')
    sys.exit(1)

import pdb; pdb.set_trace()
# todo: check that this is working
result_json = result.json()
access_token = result_json['access_token']

# TODO: upload using access_token
# according to the following CURL:
'''
curl \
    -H "Authorization: Bearer $CHROME_ACCESS_TOKEN"  \
    -H "x-goog-api-version: 2" \
    -X PUT \
    -T "./releases/20230805_tkast_1.0.0.zip" \
    -v \
    https://www.googleapis.com/upload/chromewebstore/v1.1/items/$CHROME_ITEM_ID
'''
'''
curl \
    -H "X-goog-api-key: $CHROME_API_KEY" \
    -H "x-goog-api-version: 2" \
    -X PUT \
    -T "./releases/20230805_tkast_1.0.0.zip" \
    -v \
    https://www.googleapis.com/upload/chromewebstore/v1.1/items/$CHROME_ITEM_ID
'''

'''
file_contents = open(sys.argv[1], 'rb').read()
encoded_contents = base64.b64encode(file_contents)
payload = encoded_contents
result = requests.post('https://accounts.google.com/o/oauth2/token',
                       data=payload)

print(result.text)

if result.status_code != requests.codes.ok or 'failed' in result.json():
    sys.exit(1)
'''
