

import {Scalekit} from '@scalekit-sdk/node';

console.log(process.env.SCALEKIT_ENVIRONMENT_URL)

const scalekit = new Scalekit(
     process.env.SCALEKIT_ENVIRONMENT_URL!,
    process.env.SCAKLEKIT_CLIENT_ID!,
    process.env.SCALEKIT_CLIENT_SECRET!,
   
);

export default scalekit;