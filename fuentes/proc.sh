#!/bin/bash
# uso: proc.sh entrada salida.mp3
f="$1"; out="$2"
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f")
mapfile -t L < <(ffmpeg -hide_banner -i "$f" -af silencedetect=n=-42dB:d=0.25 -vn -f null - 2>&1 | grep -oE "silence_(start|end): [0-9.]+")
# primer fin de silencio = inicio de voz; último inicio de silencio = fin de voz
start=0; end=$dur
for l in "${L[@]}"; do case $l in silence_end*) [ "$start" = 0 ] && start=${l#*: };; esac; done
for l in "${L[@]}"; do case $l in silence_start*) s=${l#*: }; if (( $(echo "$s > $start" | bc -l) )); then end=$s; fi;; esac; done
a=$(echo "if ($start-0.2<0) 0 else $start-0.2" | bc -l); b=$(echo "if ($end+0.25>$dur) $dur else $end+0.25" | bc -l); len=$(echo "$b-$a" | bc -l); a=$(printf "%.3f" $a); len=$(printf "%.3f" $len)
mx=$(ffmpeg -hide_banner -ss $a -t $len -i "$f" -af "highpass=f=90,afftdn=nf=-30" -vn -f null - 2>&1; ffmpeg -hide_banner -ss $a -t $len -i "$f" -af "highpass=f=90,afftdn=nf=-30,volumedetect" -vn -f null - 2>&1 | grep -oE "max_volume: [-0-9.]+" | grep -oE "[-0-9.]+$")
mx=$(echo "$mx" | tail -1); gain=$(echo "-4 - ($mx)" | bc -l)
fo=$(printf "%.3f" $(echo "$len-0.15" | bc -l))
ffmpeg -v error -y -ss $a -t $len -i "$f" -vn -af "highpass=f=90,afftdn=nf=-30,volume=${gain}dB,alimiter=limit=0.9,afade=t=in:d=0.04,afade=t=out:st=$fo:d=0.15" -ac 1 -ar 44100 -b:a 128k "$out"
echo "voz: $start-$end s | pico original: $mx dB | ganancia: $gain dB | dura: $len"
