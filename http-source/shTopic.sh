fluvio topic list | awk 'NR>1  {print "fluvio topic delete ", $1}' | while read cmd; do
  echo "Executing: $cmd"
  eval "$cmd"
done
