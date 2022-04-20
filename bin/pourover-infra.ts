#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { Pipeline } from "../lib/pipeline";
import { config } from "dotenv";

config();

const app = new cdk.App();
new Pipeline(app, "PourOverLabsPipeline");
