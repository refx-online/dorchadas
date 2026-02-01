build:
	docker build -t frontend:latest .

run:
	docker run \
		--network=host \
		--env-file=.env \
		-v meat-my-beat-i_data:/srv/root/.data \
		-it frontend:latest

clean:
	rm -rf dist