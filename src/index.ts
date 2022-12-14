/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler publish src/index.ts --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import getErrorMessage from "./errorHandling";
import weatherExamplePayload from '../data/init_fday5_weather';

export interface Env {
  // Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
  // MY_KV_NAMESPACE: KVNamespace;
  //
  // Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
  // MY_DURABLE_OBJECT: DurableObjectNamespace;
  //
  // Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
  // MY_BUCKET: R2Bucket;
  // 
  // 
  OPENWEATHER_API_URL: string,
  OPENWEATHER_API_KEY: string
}


async function handleRequest(request: Request, env: Env) {
  /**
   * The best practice is to only assign new RequestInit properties
   * on the request object using either a method or the constructor
   */
  const newRequestInit = {
    // Change method
    method: 'GET',
    // Change body
    // body: JSON.stringify({ bar: 'foo' }),
    // Change the redirect mode.
    redirect: 'follow',
    // Change headers, note this method will erase existing headers
    // headers: {
    // 	'Content-Type': 'application/json',
    // },
    // Change a Cloudflare feature on the outbound response
    cf: { apps: false },
  };

  const owmUrl = env.OPENWEATHER_API_URL || 'http://api.openweathermap.org/data/2.5';
  const openweatherApiKey = env.OPENWEATHER_API_KEY;

  const owmForecastUrl = `${owmUrl}/forecast`;
  const url = new URL(owmForecastUrl);

  const initUrl = new URL(request.url);

  // set weather api params
  initUrl.searchParams.forEach((value, key) => {
    url.searchParams.append(key, value);
  });
  url.searchParams.append('appid', openweatherApiKey);

  // console.log(initUrl.searchParams.toString());
  // console.log(url.toString());

  let response = new Response(JSON.stringify(weatherExamplePayload), { status: 200 });


  const ua = request.headers.get('user-agent')
  let botName = ua?.match(/[^\s]+\-Google[^\s;]*|Googlebot[^\s;]*/g);

  // CHECK FOR GOOGLEBOT, IF IS PRESENT RETURN WITH DUMMY DATA LOADED ABOVE
  if (!botName) {
    // Best practice is to always use the original request to construct the new request
    // to clone all the attributes. Applying the URL also requires a constructor
    // since once a Request has been constructed, its URL is immutable.
    const newRequest = new Request(url.toString(), new Request(request, newRequestInit));

    try {
      response = await fetch(newRequest);
    } catch (e) {
      response = new Response(JSON.stringify({ error: getErrorMessage(e) }), { status: 500 });
    }
  } else {
    console.log(`Accesed by ${botName}, respond with dummy data`);
  }

  const responseHeaders = new Headers(response.headers)
  responseHeaders.set('Access-Control-Allow-Origin', '*')
  return new Response(response.body, {
    headers: responseHeaders,
    status: response.status,
    statusText: response.statusText
  });
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    return handleRequest(request, env);
  },
};
