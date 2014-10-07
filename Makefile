REPORTER = spec

test:
	cqlsh -f test/scripts/medint.cql
	cqlsh -f test/scripts/medsafe.cql
	mysql -u root < test/scripts/medint.sql
	mysql -u root < test/scripts/medsafe.sql
	rabbitmqadmin declare exchange name=caresharing.medintegrate type=direct durable=true
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--reporter $(REPORTER) \
		--check-leaks \
		--recursive \

.PHONY: test