import tensorflow as tf
import pandas as pd
from sklearn.model_selection import train_test_split
import numpy as np
import matplotlib.pyplot as plt
import tensorflowjs as tfjs



def init():
    print("TensorFlow version:", tf.__version__)

    print("Creating DataFrame from csv...")

    # Read the CSV file into a DataFrame
    raw_data = pd.read_csv("./judge_stats.csv", low_memory=False)

    # Drop rows that have any NaN or nul values
    raw_data.fillna(0, inplace=True)

    # Filter the data to just the columns we want
    filtered_data = raw_data.filter(regex='^(release_speed|events|zone|pitch_number|pitch_type|home_score|away_score|balls|strikes|p_throws|outs_when_up|on_3b|on_2b|on_1b)')

    # Drop rows where the pitch was not in the strike zone
    filtered_data = filtered_data[(filtered_data['zone'] >= 1) & (filtered_data['zone'] <= 9)]

    # Determine who was on base replacing binary for existence of runner
    #1b
    filtered_data['on_3b'] = filtered_data['on_3b'].where(filtered_data['on_3b'].notna(), 0)
    filtered_data['on_3b'] = filtered_data['on_3b'].where(filtered_data['on_3b'].isna(), 1)
    #2b
    filtered_data['on_2b'] = filtered_data['on_2b'].where(filtered_data['on_2b'].notna(), 0)
    filtered_data['on_2b'] = filtered_data['on_2b'].where(filtered_data['on_2b'].isna(), 1)
    #3b
    filtered_data['on_1b'] = filtered_data['on_1b'].where(filtered_data['on_1b'].notna(), 0)
    filtered_data['on_1b'] = filtered_data['on_1b'].where(filtered_data['on_1b'].isna(), 1)

    # Clean the data to return pitch type based on the pitch type code
    pitch_map = {
        'CH': 1, 
        'SL': 2,
        'SI': 3,
        'KC': 4,
        'FF': 5,
        'FC': 6,
        'CU': 7,
        }

    p_throws_map = {
        'L': 1,
        'R': 2
    }

    # Map the pitch type to the pitch type code
    filtered_data['pitch_type'] = filtered_data['pitch_type'].map(lambda x: pitch_map.get(x, 0))

    # Map the pitch hand to the pitch hand code
    filtered_data['p_throws'] = filtered_data['p_throws'].map(lambda x: p_throws_map.get(x, 2))


    # Drop the original events column since it has been replaced with the one-hot encoded version
    X = filtered_data.drop(columns=['events'])
    y = pd.get_dummies(filtered_data['events'], prefix='event')

    print(X.columns)
    # Create a dict of event_indexes to use for the class_weight parameter
    event_indexes = y.columns[y.columns.str.startswith('event_')]

    print(event_indexes)
    # Check if any values are null before we proceed
    isXNull = X.isnull().any()
    isYNull = y.isnull().any()
    print(isXNull, isYNull)

    # Split the filtered_data into training and validation sets
    x_train, x_test, y_train, y_test = train_test_split(X, y, train_size=0.9)

    # Make sure all type conversions are valid
    x_train = np.asarray(x_train).astype(np.float32)
    y_train = np.asarray(y_train).astype(np.float32)

    # Define the model
    model = tf.keras.models.Sequential([
        tf.keras.layers.Dense(64, activation='relu', input_shape=(13,)),
        tf.keras.layers.Dense(64, activation='relu'),
        tf.keras.layers.Dense(18, 'softmax')
    ])

    # Compile the model
    model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])

    event_map = {
        'event_catcher_interf': 0,
        'event_caught_stealing_2b': 0,
        'event_caught_stealing_home': 0,
        'event_double': 1, 
        'event_double_play': 0,
        'event_field_error': 0,
        'event_field_out': 1,
        'event_fielders_choice': 0,
        'event_fielders_choice_out': 0,
        'event_force_out': 0,
        'event_grounded_into_double_play': 0,
        'event_hit_by_pitch': 0, 
        'event_home_run': 2,
        'event_other_out': 0,
        'event_sac_fly': 0,
        'event_single': 1,
        'event_strikeout': 1,
        'event_strikeout_double_play': 0,
        'event_triple': 1,
        'event_walk': 0,
        'event_0': 0
    }

    class_weight = {idx: event_map.get(index, 1.0) for (idx, index) in enumerate(event_indexes)}

    # Define number of runs to put it through
    num_epochs = 99

    # Shuffle the data
    # np.random.shuffle(x_train)
    # np.random.shuffle(y_train)

    print(x_train)

    # Train the model
    history = model.fit(x_train, y_train, epochs=num_epochs, class_weight=class_weight, verbose=1 )
    print(history.history.keys())
    prediction = model.predict(x_test)
    score = model.evaluate(x_test, y_test, verbose=0)

    # Plot the loss v accuracy
    plt.plot(history.history['loss'])
    plt.plot(history.history['accuracy'])
    plt.title('Model Loss vs Accuracy')
    plt.ylabel('Loss')
    plt.xlabel('Epoch')
    plt.legend(['loss', 'accuracy'], loc='upper left')
    plt.savefig('./h5_model/loss_vs_accuracy.png')

    # Print predicted events on the pitch
    event_index = prediction.argmax(axis=1)
    predicted_events = [list(y_test.columns)[index] for index in event_index]
    print(predicted_events)

    # Print percentage probability of home run event
    event_home_run_idx = y.columns.get_loc('event_home_run')
    print(event_home_run_idx)
    print('event_home_run', prediction[:20][event_home_run_idx])

    # Print test summaries
    print('Test loss:', score[0])
    print('Test accuracy:', score[1])
    print(prediction[0])

    # Save the trained model
    model.save("./h5_model/trained_model.h5")
    tfjs.converters.save_keras_model(model, './json_model', metadata={'class_labels': y.columns.tolist()})


if __name__ == "__main__":
    init()
    