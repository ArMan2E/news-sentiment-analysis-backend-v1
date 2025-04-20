#!/bin/bash

#cdk 
PACKAGE_NAME="infinyon-http-source-0.4.3"
PACKAGE_IPKG=${PACKAGE_NAME}.ipkg
HTTP_SOURCE_DIR="."
# LOG_DEPLOY="deploy.txt"
#func to deploy topic
deploy_configurations() {
	for file in ${HTTP_SOURCE_DIR}/*.yaml; do
		if [ -f "$file" ]; then
			echo "Deploying ${file}..."
			echo "Command : cdk deploy start --ipkg ${PACKAGE_IPKG} -c ${file}"
			cdk deploy start --ipkg ${PACKAGE_IPKG} -c ${file}
		else
			echo "Skipping ${file}."
		fi
	done
}

#FUNC TO CREATE TOPICS
# ig unncessary as there is option to create topic in yaml
create_topics() {
	for file in ${HTTP_SOURCE_DIR}/*.yaml; do
		if [ -f "$file" ]; then
			#Extract topic name using sed cli
			topic=$(sed -n 's/^[[:space:]]*topic:[[:space:]]*\(.*\)/\1/p' "$file")
			if [ -n "$topic" ]; then
				#check if topic already exists
					if fluvio topic list | grep -q "^${topic}$"; then
						echo "Topic ${topic} already exists"
					else
						echo "Creating topic ${topic}..."
						fluvio topic create ${topic} --retention-time '2hr' --segment-size '500 MiB' --dedup --dedup-age '10s'
					fi
			else
				echo "No topic found in ${file}."
			fi
		else
			echo "Skipping ${file}."
		fi
	done
}

# main script execution func call
#create topic
create_topics
#deploy with config
deploy_configurations

echo "Script executed..."
