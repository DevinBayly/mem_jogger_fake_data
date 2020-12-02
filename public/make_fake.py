import json
import datetime
import time
import numpy as np
import random

with open("only_rooms.json","r") as phile:
    rooms_list = json.loads(phile.read())

number_entries = 200

rooms = [r for r in rooms_list if r != None]
room_data = [random.choice(rooms) for i in range(number_entries)]
print(rooms,room_data)
now = time.time()
rand_subs = now - np.random.rand((number_entries))*5000000
rand_dates = [datetime.datetime.fromtimestamp(e).isoformat(timespec="seconds") for e in rand_subs]
print(rand_dates)
rand_durations = [f"{1 if random.random() > .5 else 0:02}:{random.randint(0,60):02}:{random.randint(0,60):02}" for i in range(number_entries)]
print(rand_durations)

my_data = [dict(apBuildingNumber = room_data[i],_time=rand_dates[i],niceDuration=rand_durations[i]) for i in range(number_entries)]
print(my_data)

with open(f"my_fake_data_{int(time.time())}.json","w" ) as phile:
    phile.write(json.dumps(my_data))
