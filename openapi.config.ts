const { generateService } = require("@umijs/openapi");

generateService({
  requestLibPath: "import request from '@/utils/request'",
  schemaPath: "http://localhost:8811/api/v3/api-docs/default",
  serversPath: "./src",
});
