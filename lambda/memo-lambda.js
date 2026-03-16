const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, QueryCommand, UpdateCommand, DeleteCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME;

exports.handler = async (event) => {

  console.log("EVENT:", JSON.stringify(event));

  const method = event.httpMethod;
  const body = event.body ? JSON.parse(event.body) : {};

  try {

    const claims =
      event?.requestContext?.authorizer?.claims ??
      event?.requestContext?.authorizer?.jwt?.claims ??
      null;

    const userId =
      claims?.sub ??
      claims?.["cognito:username"] ??
      body?.userId ??
      event?.queryStringParameters?.userId ??
      null;

    if (!userId) {
      return response(400, { message: "Missing userId" });
    }

    // メモ作成
    if (method === "POST") {

      const memoId = Date.now().toString();
      const content = body.content ?? body.text ?? "";

      if (!content) {
        return response(400, { message: "Missing content" });
      }

      const params = {
        TableName: TABLE_NAME,
        Item: {
          userId: userId,
          memoId: memoId,
          content: content,
          createdAt: new Date().toISOString()
        }
      };

      await dynamodb.send(new PutCommand(params));

      return response(200, {
        message: "Memo created",
        memoId: memoId
      });
    }

    // メモ一覧取得
    if (method === "GET") {

      const params = {
        TableName: TABLE_NAME,
        KeyConditionExpression: "userId = :uid",
        ExpressionAttributeValues: {
          ":uid": userId
        }
      };

      const result = await dynamodb.send(new QueryCommand(params));

      return response(200, result.Items);
    }

    // メモ更新
    if (method === "PUT") {

      const content = body.content ?? body.text ?? "";

      if (!body.memoId) {
        return response(400, { message: "Missing memoId" });
      }

      if (!content) {
        return response(400, { message: "Missing content" });
      }

      const params = {
        TableName: TABLE_NAME,
        Key: {
          userId: userId,
          memoId: body.memoId
        },
        UpdateExpression: "SET content = :c",
        ExpressionAttributeValues: {
          ":c": content
        },
        ReturnValues: "UPDATED_NEW"
      };

      const result = await dynamodb.send(new UpdateCommand(params));

      return response(200, {
        message: "Memo updated",
        updated: result.Attributes
      });
    }

    // メモ削除
    if (method === "DELETE") {

      if (!body.memoId) {
        return response(400, { message: "Missing memoId" });
      }

      const params = {
        TableName: TABLE_NAME,
        Key: {
          userId: userId,
          memoId: body.memoId
        }
      };

      await dynamodb.send(new DeleteCommand(params));

      return response(200, {
        message: "Memo deleted"
      });
    }

    return response(400, { message: "Unsupported method" });

  } catch (error) {

    console.error(error);

    return response(500, {
      message: "Internal server error",
      error: error.message
    });
  }

};

function response(statusCode, body) {

  return {
    statusCode: statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify(body)
  };

}