🪣 Switching to S3 Storage | Open WebUI







[Skip to main content](#__docusaurus_skipToContent_fallback)

[![](/images/logo.png)![](/images/logo-dark.png)

**Open WebUI**](/)[Blog](/blog)

[GitHub](https://github.com/open-webui/open-webui)[Discord](https://discord.com/invite/5rJgQTnV4s)

[![Open WebUI](/sponsors/banners/placeholder.png)](https://forms.gle/92mvG3ESYj47zzRL9)

The top banner spot is reserved for Emerald+ Enterprise sponsors

* [🏡 Home](/)
* [🚀 Getting Started](/getting-started/)
* [⭐ Features](/features/)
* [🔨 OpenAPI Tool Servers](/openapi-servers/)
* [🛠️ Troubleshooting](/troubleshooting/)
* [📝 Tutorials](/category/-tutorials)

  + [🔗 Integrations](/category/-integrations)
  + [🐳 Installing Docker](/tutorials/docker-install)
  + [🛠️ Maintenance](/category/️-maintenance)
  + [🎤 Speech To Text](/category/-speech-to-text)
  + [🗨️ Text-to-Speech](/category/️-text-to-speech)
  + [🎨 Image Generation](/tutorials/images)
  + [🌐 Web Search](/category/-web-search)
  + [🔌 Offline Mode](/tutorials/offline-mode)
  + [🔒 HTTPS](/category/-https)
  + [📦 Exporting and Importing Database](/tutorials/database)
  + [🪣 Switching to S3 Storage](/tutorials/s3-storage)
  + [🐍 Jupyter Notebook Integration](/tutorials/jupyter)
  + [💡 Tips & Tricks](/category/-tips--tricks)
  + [☁️ Deployment](/tutorials/deployment/)
* [📋 FAQ](/faq)
* [🛣️ Roadmap](/roadmap)
* [🔒 Security Policy](/security)
* [🤝 Contributing](/contributing)
* [🌐 Sponsorships](/sponsorships)
* [🎨 Design Guidelines](/brand)
* [⚖️ Open WebUI License](/license)
* [🏢 Open WebUI for Enterprises](/enterprise/)
* [🎯 Our Mission](/mission)
* [👥 Our Team](/team)

Sponsored by Open WebUI

[![Open WebUI](/sponsors/banners/placeholder-mobile.png)](https://forms.gle/92mvG3ESYj47zzRL9)

The top banner spot is reserved for Emerald+ Enterprise sponsors

* [📝 Tutorials](/category/-tutorials)
* 🪣 Switching to S3 Storage

On this page

warning

This tutorial is a community contribution and is not supported by the Open WebUI team. It serves only as a demonstration on how to customize Open WebUI for your specific use case. Want to contribute? Check out the contributing tutorial.

🪣 Switching to S3 Storage
=========================

This guide provides instructions on how to switch the default `local` storage in Open WebUI config to Amazon S3.

Prerequisites[​](#prerequisites "Direct link to Prerequisites")
---------------------------------------------------------------

In order to follow this tutorial, you must have the following:

* An active AWS account
* An active AWS Access Key and Secret Key
* IAM permissions in AWS to create and put objects in S3
* Docker installed on your system

What is Amazon S3[​](#what-is-amazon-s3 "Direct link to What is Amazon S3")
---------------------------------------------------------------------------

Direct from AWS' website:

"Amazon S3 is an object storage service that offers industry-leading scalability, data availability, security, and performance. Store and protect any amount of data for a range of use cases, such as data lakes, websites, cloud-native applications, backups, archive, machine learning, and analytics. Amazon S3 is designed for 99.999999999% (11 9's) of durability, and stores data for millions of customers all around the world."

To learn more about S3, visit: [Amazon S3's Official Page](https://aws.amazon.com/s3/)

How to Set-Up
=============

1. Required environment variables[​](#1-required-environment-variables "Direct link to 1. Required environment variables")
--------------------------------------------------------------------------------------------------------------------------

In order to configure this option, you need to gather the following environment variables:

| **Open-WebUI Environment Variable** | **Example Value** |
| --- | --- |
| `S3_ACCESS_KEY_ID` | ABC123 |
| `S3_SECRET_ACCESS_KEY` | SuperSecret |
| `S3_ENDPOINT_URL` | <https://s3.us-east-1.amazonaws.com> |
| `S3_REGION_NAME` | us-east-1 |
| `S3_BUCKET_NAME` | my-awesome-bucket-name |

* S3\_ACCESS\_KEY\_ID: This is an identifier for your AWS account's access key. You get this from the AWS Management Console or AWS CLI when creating an access key.
* S3\_SECRET\_ACCESS\_KEY: This is the secret part of your AWS access key pair. It's provided when you create an access key in AWS and should be stored securely.
* S3\_ENDPOINT\_URL: This URL directs to your S3 service endpoint and can typically be found in AWS service documentation or account settings.
* S3\_REGION\_NAME: This is the AWS region where your S3 bucket resides, like "us-east-1". You can identify this from the AWS Management Console under your S3 bucket details.
* S3\_BUCKET\_NAME: This is the unique name of your S3 bucket, which you specified when creating the bucket in AWS.

For a complete list of the available S3 endpoint URLs, see: [Amazon S3 Regular Endpoints](https://docs.aws.amazon.com/general/latest/gr/s3.html)

See all the `Cloud Storage` configuration options in the [Open-WebUI Cloud Storage Config](https://docs.openwebui.com/getting-started/env-configuration#cloud-storage) documentation.

2. Run Open-WebUI[​](#2-run-open-webui "Direct link to 2. Run Open-WebUI")
--------------------------------------------------------------------------

Before we launch our instance of Open-WebUI, there is one final environment variable called `STORAGE_PROVIDER` we need to set. This variable tells Open-WebUI which provider you want to use. By default, `STORAGE_PROVIDER` is empty which means Open-WebUI uses local storage.

| **Storage Provider** | **Type** | **Description** | **Default** |
| --- | --- | --- | --- |
| `local` | str | Defaults to local storage if an empty string (`' '`) is provided | Yes |
| `s3` | str | Uses S3 client library and related environment variables mentioned in Amazon S3 Storage | No |
| `gcs` | str | Uses GCS client library and related environment variables mentioned in Google Cloud Storage | No |

To use Amazon S3, we need to set `STORAGE_PROVIDER` to "S3" along with all the environment variables we gathered in Step 1 (`S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_ENDPOINT_URL`, `S3_REGION_NAME`, `S3_BUCKET_NAME`).

Here, I'm also setting the `ENV` to "dev", which will allow us to see the Open-WebUI Swagger docs so we can further test and confirm the S3 storage set-up is working as expected.

```
docker run -d \  
  -p 3000:8080 \  
  -v open-webui:/app/backend/data \  
  -e STORAGE_PROVIDER="s3" \  
  -e S3_ACCESS_KEY_ID="ABC123" \  
  -e S3_SECRET_ACCESS_KEY="SuperSecret" \  
  -e S3_ENDPOINT_URL="https://s3.us-east-1.amazonaws.com" \  
  -e S3_REGION_NAME="us-east-1" \  
  -e S3_BUCKET_NAME="my-awesome-bucket-name" \  
  -e ENV="dev" \  
  --name open-webui \  
  ghcr.io/open-webui/open-webui:main
```

3. Test the set-up[​](#3-test-the-set-up "Direct link to 3. Test the set-up")
-----------------------------------------------------------------------------

Now that we have Open-WebUI running, let's upload a simple `Hello, World` text file and test our set-up.

![Upload a file in Open-WebUI](/assets/images/amazon-s3-upload-file-3464129184257f7abc659a70de4b783e.png)

And confirm that we're getting a response from the selected LLM.

![Get a response in Open-WebUI](/assets/images/amazon-s3-oui-response-7c96ea3ce551c02a0578538ca5fb926b.png)

Great! Looks like everything is worked as expected in Open-WebUI. Now let's verify that the text file was indeed uploaded and stored in the specified S3 bucket. Using the AWS Management Console, we can see that there is now a file in the S3 bucket. In addition to the name of the file we uploaded (`hello.txt`) you can see the object's name was appended with a unique ID. This is how Open-WebUI tracks all the files uploaded.

![Get a response in Open-WebUI](/assets/images/amazon-s3-object-in-bucket-8bd269cccabb2e7222e02da4b285d3e5.png)

Using Open-WebUI's swagger docs, we can get all the information related to this file using the `/api/v1/files/{id}` endpoint and passing in the unique ID (4405fabb-603e-4919-972b-2b39d6ad7f5b).

![Inspect the file by ID](/assets/images/amazon-s3-get-file-by-id-f71df9773746621e8c2dae9d5ebd4c24.png)

[Edit this page](https://github.com/open-webui/docs/blob/main/docs/tutorials/s3-storage.md)

[Previous

📦 Exporting and Importing Database](/tutorials/database)[Next

🐍 Jupyter Notebook Integration](/tutorials/jupyter)

* [Prerequisites](#prerequisites)
* [What is Amazon S3](#what-is-amazon-s3)
* [1. Required environment variables](#1-required-environment-variables)
* [2. Run Open-WebUI](#2-run-open-webui)
* [3. Test the set-up](#3-test-the-set-up)

Docs

* [Getting Started](/getting-started)
* [FAQ](/faq)
* [Help Improve The Docs](https://github.com/open-webui/docs)

Community

* [GitHub](https://github.com/open-webui/open-webui)
* [Discord](https://discord.gg/5rJgQTnV4s)
* [Reddit](https://www.reddit.com/r/OpenWebUI/)
* [𝕏](https://x.com/OpenWebUI)

More

* [Release Notes](https://github.com/open-webui/open-webui/blob/main/CHANGELOG.md)
* [About](https://openwebui.com)
* [Report a Vulnerability / Responsible Disclosure](https://openwebui.com)

![](/images/logo-dark.png)![](/images/logo-dark.png)

---

### Referenced Links
- #__docusaurus_skipToContent_fallback
- /
- /blog
- https://github.com/open-webui/open-webui
- https://discord.com/invite/5rJgQTnV4s
- https://forms.gle/92mvG3ESYj47zzRL9
- /
- /getting-started/
- /features/
- /openapi-servers/
- /troubleshooting/
- /category/-tutorials
- /category/-integrations
- /tutorials/docker-install
- /category/️-maintenance
- /category/-speech-to-text
- /category/️-text-to-speech
- /tutorials/images
- /category/-web-search
- /tutorials/offline-mode
- /category/-https
- /tutorials/database
- /tutorials/s3-storage
- /tutorials/jupyter
- /category/-tips--tricks
- /tutorials/deployment/
- /faq
- /roadmap
- /security
- /contributing
- /sponsorships
- /brand
- /license
- /enterprise/
- /mission
- /team
- https://forms.gle/92mvG3ESYj47zzRL9
- /
- /category/-tutorials
- #prerequisites
- #what-is-amazon-s3
- https://aws.amazon.com/s3/
- #1-required-environment-variables
- https://s3.us-east-1.amazonaws.com
- https://docs.aws.amazon.com/general/latest/gr/s3.html
- https://docs.openwebui.com/getting-started/env-configuration#cloud-storage
- #2-run-open-webui
- #3-test-the-set-up
- https://github.com/open-webui/docs/blob/main/docs/tutorials/s3-storage.md
- /tutorials/database
- /tutorials/jupyter
- #prerequisites
- #what-is-amazon-s3
- #1-required-environment-variables
- #2-run-open-webui
- #3-test-the-set-up
- /getting-started
- /faq
- https://github.com/open-webui/docs
- https://github.com/open-webui/open-webui
- https://discord.gg/5rJgQTnV4s
- https://www.reddit.com/r/OpenWebUI/
- https://x.com/OpenWebUI
- https://github.com/open-webui/open-webui/blob/main/CHANGELOG.md
- https://openwebui.com
- https://openwebui.com
