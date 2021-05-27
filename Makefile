deploy.ts:
	deno run -A cli.ts testdata -y -o deploy.ts

test:
	deno test -A

serve:
	make deploy.ts
	deployctl run deploy.ts

.PHONY: deploy.ts test
