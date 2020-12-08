#! /bin/bash
#
#  Dummy Cert Generator
#    by Thomas Kottke <t.kottke90@gmail.com>
#
#  Generate Self Signed SSL Certs to be used for development HTTPS servers
#    usage: dummy-certs.sh
#

defaultKey="domain.key"
defaultCert="domain.crt"

KEY_FILE=${1:-$defaultKey}
CERT_FILE=${2:-$defaultCert}

if [ ! -d "./certs" ]; then
  mkdir certs
fi

cd certs

openssl req -newkey rsa:2048 -nodes -keyout test.key -x509 -days 365 -out test.crt

cd ..

echo "Dummy Cert Creation Complete"