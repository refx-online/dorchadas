build:
	docker compose build

run:
	docker compose up --build

clean:
	rm -rf dist