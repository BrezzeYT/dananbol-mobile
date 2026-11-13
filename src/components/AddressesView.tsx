import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import {
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
} from './icons';
import { CatalogPagination } from './CatalogPagination';
import {
  fetchMobileAddresses,
  createMobileAddress,
  deleteMobileAddress,
  lookupPostalOffice,
} from '../api/addresses';
import { useAuthContext } from '../context/useAuthContext';
import { addressesStyles as s } from '../styles/AddressesView.styles';
import type { Address, Zone } from '../types/addresses';

interface AddressesViewProps {
  onBack: () => void;
  initialShowAddForm?: boolean;
}

export const AddressesView: React.FC<AddressesViewProps> = ({ onBack, initialShowAddForm = false }) => {
  const { token } = useAuthContext();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [showAddForm, setShowAddForm] = useState(initialShowAddForm);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [postcode, setPostcode] = useState('');
  const [city, setCity] = useState('');
  const [address1, setAddress1] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [zoneName, setZoneName] = useState('');
  const [isSearchingPostcode, setIsSearchingPostcode] = useState(false);
  const [postcodeError, setPostcodeError] = useState<string | null>(null);
  const [isApiControlled, setIsApiControlled] = useState(false);

  const [addressToDelete, setAddressToDelete] = useState<Address | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Не авторизован');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    fetchMobileAddresses(token)
      .then((res) => {
        if (res.ok) {
          if (res.addresses) setAddresses(res.addresses);
          if (res.zones) setZones(res.zones);
        } else {
          setError(res.error || 'Ошибка загрузки адресов');
        }
      })
      .catch((err) => {
        setError(err.message || 'Ошибка сети');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [token]);

  const handlePostcodeLookup = async () => {
    const zip = postcode.replace(/\D/g, '').slice(0, 6);
    if (zip.length !== 6) {
      setPostcodeError('Индекс должен состоять из 6 цифр.');
      return;
    }

    setIsSearchingPostcode(true);
    setPostcodeError(null);

    try {
      const resp = await lookupPostalOffice(zip);
      if (!resp || resp.success !== true || !resp.data || !resp.data.length) {
        if (resp && resp.error === 'ПОЧТОМАТ') {
          setPostcodeError(
            'Доставка в почтоматы/ПВЗ не осуществляется, введите индекс почтового отделения'
          );
        } else {
          setPostcodeError(
            'Почтовое отделение не найдено, введите корректный индекс'
          );
        }
        return;
      }

      const item = resp.data[0];
      const a = item.address;
      const c = (
        (a.settlementTypeOrCityType || '') +
        ' ' +
        (a.settlementOrCity || '')
      ).trim();
      const addr = a.shortAddress ? String(a.shortAddress).trim() : '';

      if (c && addr) {
        setCity(c);
        setAddress1(addr);
        setIsApiControlled(true);

        const foundZoneId = resp.zone_id ? String(resp.zone_id) : '';
        setZoneId(foundZoneId);

        if (foundZoneId && zones.length > 0) {
          const matched = zones.find((z) => String(z.id) === foundZoneId);
          if (matched) setZoneName(matched.name);
        }
      } else {
        setPostcodeError(
          'Почтовое отделение не найдено, введите корректный индекс'
        );
      }
    } catch (err: unknown) {
      console.warn('Postcode lookup error:', err);
      const msg = err instanceof Error ? err.message : 'Ошибка поиска отделения почты';
      setPostcodeError(msg);
    } finally {
      setIsSearchingPostcode(false);
    }
  };

  const handleSaveAddress = async () => {
    if (!token) return;

    if (!firstname.trim()) {
      setCreateError('Укажите имя');
      return;
    }
    if (!lastname.trim()) {
      setCreateError('Укажите фамилию');
      return;
    }
    if (!isApiControlled || !zoneId) {
      setCreateError('Сначала найдите почтовое отделение по индексу');
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      const res = await createMobileAddress(token, {
        firstname: firstname.trim(),
        lastname: lastname.trim(),
        city,
        postcode,
        address_1: address1,
        zone_id: parseInt(zoneId, 10),
      });

      if (res.ok && res.address) {
        setAddresses((prev) => [res.address!, ...prev]);
        resetForm();
        setShowAddForm(false);
      } else {
        setCreateError(res.error || 'Не удалось сохранить адрес');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка сохранения адреса';
      setCreateError(msg);
    } finally {
      setIsCreating(false);
    }
  };


  const handleDeleteAddress = (addr: Address) => {
    setDeleteError(null);
    setAddressToDelete(addr);
  };

  const handleConfirmDelete = async () => {
    if (!addressToDelete || !token) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await deleteMobileAddress(token, addressToDelete.id);
      if (res.ok) {
        setAddresses((prev) => prev.filter((a) => a.id !== addressToDelete.id));
        setAddressToDelete(null);
      } else {
        setDeleteError(res.error || 'Не удалось удалить адрес');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка при удалении адреса';
      setDeleteError(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const resetForm = () => {
    setFirstname('');
    setLastname('');
    setPostcode('');
    setCity('');
    setAddress1('');
    setZoneId('');
    setZoneName('');
    setIsApiControlled(false);
    setPostcodeError(null);
    setCreateError(null);
  };


  if (showAddForm) {
    return (
      <ScrollView
        style={s.container}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.subHeader}>
          <Text style={s.sectionTitle}>Новый адрес</Text>
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => {
              resetForm();
              setShowAddForm(false);
            }}
            activeOpacity={0.7}
          >
            <ArrowLeftIcon size={18} color="#5a7085" strokeWidth={2} />
            <Text style={s.backBtnText}>Назад</Text>
          </TouchableOpacity>
        </View>

        <View style={s.form}>

          <View style={s.formRow}>
            <View style={s.formCol}>
              <View style={s.inputGroup}>
                <Text style={s.label}>Имя *</Text>
                <TextInput
                  style={s.input}
                  placeholder="Иван"
                  placeholderTextColor="#94a3b8"
                  value={firstname}
                  onChangeText={setFirstname}
                  editable={!isCreating}
                />
              </View>
            </View>
            <View style={s.formCol}>
              <View style={s.inputGroup}>
                <Text style={s.label}>Фамилия *</Text>
                <TextInput
                  style={s.input}
                  placeholder="Иванов"
                  placeholderTextColor="#94a3b8"
                  value={lastname}
                  onChangeText={setLastname}
                  editable={!isCreating}
                />
              </View>
            </View>
          </View>


          <View style={s.inputGroup}>
            <Text style={s.label}>Почтовый индекс *</Text>
            <View style={s.postcodeRow}>
              <TextInput
                style={s.postcodeInput}
                placeholder="101000"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                maxLength={6}
                value={postcode}
                onChangeText={(text) => {
                  setPostcode(text.replace(/\D/g, '').slice(0, 6));
                  setPostcodeError(null);
                  setIsApiControlled(false);
                }}
                editable={!isCreating}
              />
              <TouchableOpacity
                style={[
                  s.postcodeBtn,
                  (postcode.length !== 6 || isSearchingPostcode || isCreating) &&
                  s.postcodeBtnDisabled,
                ]}
                onPress={handlePostcodeLookup}
                disabled={
                  postcode.length !== 6 || isSearchingPostcode || isCreating
                }
                activeOpacity={0.8}
              >
                {isSearchingPostcode ? (
                  <ActivityIndicator size="small" color="#6a96c3" />
                ) : (
                  <Text style={s.postcodeBtnText}>
                    {isApiControlled ? 'Найдено!' : 'Найти отделение'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
            {postcodeError && (
              <Text style={s.postcodeErrorText}>{postcodeError}</Text>
            )}
            <Text style={s.hintText}>
              Город и адрес доставки автоматически определяется по индексу.
              Доставка осуществляется до востребования в отделение Почты РФ.
            </Text>
          </View>


          <View style={s.inputGroup}>
            <Text style={s.label}>Регион *</Text>
            <View pointerEvents="none">
              <TextInput
                style={[s.input, s.inputDisabled]}
                placeholder="Заполняется по индексу"
                placeholderTextColor="#94a3b8"
                value={zoneName || (zoneId ? `Регион #${zoneId}` : '')}
                editable={false}
                selectTextOnFocus={false}
              />
            </View>
          </View>


          <View style={s.inputGroup}>
            <Text style={s.label}>Населенный пункт *</Text>
            <View pointerEvents="none">
              <TextInput
                style={[s.input, s.inputDisabled]}
                placeholder="Заполняется по индексу"
                placeholderTextColor="#94a3b8"
                value={city}
                editable={false}
                selectTextOnFocus={false}
              />
            </View>
          </View>


          <View style={s.inputGroup}>
            <Text style={s.label}>Адрес отделения *</Text>
            <View pointerEvents="none">
              <TextInput
                style={[s.input, s.inputDisabled]}
                placeholder="Заполняется по индексу"
                placeholderTextColor="#94a3b8"
                value={address1}
                editable={false}
                selectTextOnFocus={false}
              />
            </View>
          </View>

          {createError && (
            <View style={s.formError}>
              <Text style={s.formErrorText}>{createError}</Text>
            </View>
          )}


          <View style={s.actionRow}>
            <TouchableOpacity
              style={s.cancelBtn}
              onPress={() => {
                resetForm();
                setShowAddForm(false);
              }}
              disabled={isCreating}
              activeOpacity={0.7}
            >
              <Text style={s.cancelBtnText}>Отмена</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                s.saveBtn,
                (isCreating || !isApiControlled || !firstname.trim() || !lastname.trim()) &&
                s.saveBtnDisabled,
              ]}
              onPress={handleSaveAddress}
              disabled={
                isCreating || !isApiControlled || !firstname.trim() || !lastname.trim()
              }
              activeOpacity={0.8}
            >
              {isCreating ? (
                <ActivityIndicator size="small" color="#6a96c3" />
              ) : (
                <Text style={s.saveBtnText}>Сохранить</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }


  const ITEMS_PER_PAGE = 5;
  const totalPages = Math.ceil(addresses.length / ITEMS_PER_PAGE);
  const visibleAddresses = addresses.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.subHeader}>
        <Text style={s.sectionTitle}>Мои адреса</Text>
        <TouchableOpacity style={s.backBtn} onPress={onBack} activeOpacity={0.7}>
          <ArrowLeftIcon size={18} color="#5a7085" strokeWidth={2} />
          <Text style={s.backBtnText}>Назад</Text>
        </TouchableOpacity>
      </View>


      <TouchableOpacity
        style={s.addBtn}
        onPress={() => setShowAddForm(true)}
        activeOpacity={0.8}
      >
        <PlusIcon size={16} color="#ffffff" strokeWidth={2.5} />
        <Text style={s.addBtnText}>Добавить адрес</Text>
      </TouchableOpacity>

      {error && (
        <View style={s.errorBox}>
          <Text style={s.errorText}>{error}</Text>
        </View>
      )}

      {isLoading ? (
        <View style={s.loadingBox}>
          <ActivityIndicator size="large" color="#8ec0ed" />
          <Text style={s.loadingText}>Загрузка адресов...</Text>
        </View>
      ) : addresses.length === 0 && !error ? (
        <View style={s.emptyBox}>
          <Text style={s.emptyText}>У вас пока нет сохраненных адресов</Text>
        </View>
      ) : (
        <View style={s.list}>
          {visibleAddresses.map((addr) => (
            <View key={`addr_${addr.id}`} style={s.addressCard}>
              <View style={s.addressBody}>
                <Text style={s.addressText}>{addr.address}</Text>
              </View>
              <TouchableOpacity
                style={s.deleteBtn}
                onPress={() => handleDeleteAddress(addr)}
                activeOpacity={0.7}
              >
                <TrashIcon size={17} color="#ef4444" strokeWidth={1.8} />
              </TouchableOpacity>
            </View>
          ))}

          {totalPages > 1 && (
            <CatalogPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </View>
      )}

      <Modal
        visible={!!addressToDelete}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isDeleting) setAddressToDelete(null);
        }}
      >
        <TouchableOpacity
          style={s.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            if (!isDeleting) setAddressToDelete(null);
          }}
        >
          <TouchableOpacity
            style={s.modalCard}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={s.modalIconCircle}>
              <TrashIcon size={24} color="#ef4444" strokeWidth={2} />
            </View>
            <Text style={s.modalTitle}>Удалить адрес?</Text>
            <Text style={s.modalText}>
              Вы уверены, что хотите удалить этот адрес доставки?
            </Text>

            {addressToDelete && (
              <View style={s.modalSnippetBox}>
                <Text style={s.modalSnippetText} numberOfLines={3}>
                  {addressToDelete.address}
                </Text>
              </View>
            )}

            {deleteError ? (
              <Text style={s.modalErrorText}>{deleteError}</Text>
            ) : null}

            <View style={s.modalActions}>
              <TouchableOpacity
                style={s.modalCancelBtn}
                onPress={() => setAddressToDelete(null)}
                disabled={isDeleting}
                activeOpacity={0.7}
              >
                <Text style={s.modalCancelBtnText}>Отмена</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={s.modalDeleteBtn}
                onPress={handleConfirmDelete}
                disabled={isDeleting}
                activeOpacity={0.8}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={s.modalDeleteBtnText}>Удалить</Text>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
};

