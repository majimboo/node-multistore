MOCHA_OPTS= --check-leaks
REPORTER = spec

test:
	@echo "setup medint keyspace"
	@cqlsh -f test/scripts/medint.cql
	@echo "setup medsafe keyspace"
	@cqlsh -f test/scripts/medsafe.cql
	@echo "setup medint database"
	@mysql -u root < test/scripts/medint.sql
	@echo "setup medsafe database"
	@mysql -u root < test/scripts/medsafe.sql
	@rabbitmqadmin declare exchange name=caresharing.medintegrate type=direct durable=true
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--harmony \
		--reporter $(REPORTER) \
		--globals index \
		--recursive \
		--globals setImmediate,clearImmediate \
		$(MOCHA_OPTS)

.PHONY: test
