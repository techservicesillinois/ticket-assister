.PHONY: all deps test clean clean-all release publish release-dev

HEADERS:=-H "Authorization: Bearer $(CHROME_TOKEN)" -H "x-goog-api-version: 2"
URL:=https://www.googleapis.com/upload/chromewebstore/v1.1/items

all: build test

# https://developer.chrome.com/docs/webstore/using_webstore_api/
# This requires a valid CHROME_TOKEN which expires in 5 minutes.
publish: clean releases/latest.zip
	curl $(HEADERS) -X PUT -T releases/latest.zip -v $(URL)/$(CHROME_ITEM_ID)

release: releases/latest.zip
release-dev: export BUILD_OPT="-dev"
release-dev: releases/latest.zip

releases/latest.zip: build
	mkdir releases -p && cd $^ && zip -D -r ../$@ .

build: node_modules
	npm run build$(BUILD_OPT)

deps: node_modules

test: node_modules
	npm run test

package-lock.json: package.json
	npm install --include=dev
	@touch $@

node_modules: package-lock.json
	npm ci --include=dev
	@touch $@

clean:
	npm run clean

clean-all: clean
	rm -rf node_modules
	rm -f package-lock.json