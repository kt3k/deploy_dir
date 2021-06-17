deploy.ts:
	deno run -A cli.ts testdata -y -o deploy.ts --ts

deploy.js:
	deno run -A cli.ts testdata -y -o deploy.js

test:
	deno test -A

fmt:
	deno fmt

serve:
	make deploy.ts
	deployctl run deploy.ts

.PHONY: deploy.ts test
