policy_name ="BedrockInvokeTitanLite";
model_name = "amazon.titan-text-express-v1";
region = "us-east-1";
iam_user_name = "gonna-track-expense";
policy_json = {
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
  ]
};

`Cost Safety Rules
max tokens ≤ 200
temperature = 0
NEVER send raw DB data
NEVER send entire CSV content blindly
`